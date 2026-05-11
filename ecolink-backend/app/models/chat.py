from pydantic import BaseModel
from typing import List, Optional


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    is_read: bool
    attachments: Optional[List[str]] = []
    created_at: str


class ConversationParticipantResponse(BaseModel):
    user_id: int
    name: Optional[str]
    avatar: Optional[str]


class ConversationResponse(BaseModel):
    id: int
    item_id: Optional[int]
    participants: List[ConversationParticipantResponse]
    last_message: Optional[str]
    last_message_time: Optional[str]
    unread_count: int


class CreateConversationRequest(BaseModel):
    participant_id: int
    item_id: Optional[int] = None


class NewMessageRequest(BaseModel):
    content: str
    attachments: Optional[List[str]] = None
