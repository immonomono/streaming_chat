import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message
from app.utils.openai_client import openai_client


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

    # Stream from OpenAI
    full_response = ""
    stream = await openai_client.chat.completions.create(
        model=conv.model,
        messages=messages,
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
            conv.title = title
            await db.commit()
            yield f"data: {json.dumps({'title': title})}\n\n"
        except Exception:
            pass

    yield "data: [DONE]\n\n"
