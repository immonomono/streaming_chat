from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Conversation, Message
from app.schemas.conversation import ConversationCreate, ConversationUpdate, ConversationResponse, MessageResponse

router = APIRouter()


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
    )
    return [ConversationResponse.from_orm_model(c) for c in result.scalars().all()]


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    req: ConversationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(user_id=user.id, title=req.title, model=req.model)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return ConversationResponse.from_orm_model(conv)


@router.delete("/{conversation_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_uuid: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.uuid == conversation_uuid, Conversation.user_id == user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    await db.delete(conv)
    await db.commit()


@router.patch("/{conversation_uuid}", response_model=ConversationResponse)
async def update_conversation(
    conversation_uuid: str,
    req: ConversationUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.uuid == conversation_uuid, Conversation.user_id == user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    conv.title = req.title
    await db.commit()
    await db.refresh(conv)
    return ConversationResponse.from_orm_model(conv)


@router.get("/{conversation_uuid}/messages", response_model=list[MessageResponse])
async def get_messages(
    conversation_uuid: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.uuid == conversation_uuid, Conversation.user_id == user.id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
    )
    return messages.scalars().all()
