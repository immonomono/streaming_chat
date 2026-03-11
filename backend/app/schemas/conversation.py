from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    model: str = "gpt-4o-mini"


class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: str  # uuid
    title: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, conv):
        return cls(
            id=conv.uuid,
            title=conv.title,
            model=conv.model,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
        )


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
