from datetime import datetime

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str = "New Conversation"
    model: str = "gpt-4o-mini"


class ConversationResponse(BaseModel):
    id: int
    title: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
