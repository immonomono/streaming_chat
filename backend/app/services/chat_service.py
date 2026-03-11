import json
import logging
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models import Conversation, Message
from app.utils.openai_client import openai_client

logger = logging.getLogger(__name__)


async def generate_title(first_message: str) -> str:
    response = await openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Generate a concise 4-6 word title for this conversation. Return only the title, no quotes."},
            {"role": "user", "content": first_message},
        ],
        max_tokens=20,
    )
    return response.choices[0].message.content.strip()


# Approximate max input tokens per model (leave room for response)
MODEL_MAX_TOKENS = {
    "gpt-4o": 100_000,
    "gpt-4o-mini": 100_000,
}
DEFAULT_MAX_TOKENS = 60_000


def _estimate_tokens(text: str) -> int:
    return len(text) // 4


def _trim_to_window(messages: list[dict], model: str) -> list[dict]:
    max_tokens = MODEL_MAX_TOKENS.get(model, DEFAULT_MAX_TOKENS)
    total = sum(_estimate_tokens(m["content"]) for m in messages)
    if total <= max_tokens:
        return messages

    # Always keep the latest user message; trim oldest messages first
    trimmed = list(messages)
    while total > max_tokens and len(trimmed) > 1:
        removed = trimmed.pop(0)
        total -= _estimate_tokens(removed["content"])
    return trimmed


async def stream_chat_response(db: AsyncSession, conv: Conversation, user_message: str):
    # Save user message
    user_msg = Message(conversation_id=conv.id, role="user", content=user_message)
    db.add(user_msg)
    await db.commit()

    # Load conversation history
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
    )
    messages = [{"role": m.role, "content": m.content} for m in result.scalars().all()]

    # Apply sliding window to fit within model context
    api_messages = _trim_to_window(messages, conv.model)

    # Stream from OpenAI
    full_response = ""
    stream = await openai_client.chat.completions.create(
        model=conv.model,
        messages=api_messages,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_response += delta.content
            yield f"data: {json.dumps({'content': delta.content})}\n\n"

    # Save assistant message
    assistant_msg = Message(conversation_id=conv.id, role="assistant", content=full_response)
    db.add(assistant_msg)
    conv.updated_at = datetime.utcnow()
    await db.commit()

    # Auto-generate title on first exchange
    msg_count = len(messages)
    if msg_count == 1:
        try:
            title = await generate_title(user_message)
            # Persist title via independent session (avoids StreamingResponse session issues)
            async with async_session() as title_db:
                await title_db.execute(
                    update(Conversation)
                    .where(Conversation.id == conv.id)
                    .values(title=title)
                )
                await title_db.commit()
            # Also notify frontend via SSE
            yield f"data: {json.dumps({'title': title})}\n\n"
        except Exception as e:
            logger.warning("Title generation failed: %s", e)

    yield "data: [DONE]\n\n"
