from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum, DECIMAL
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    USER = "user"    # ← en minuscules
    ADMIN = "admin"  # ← en minuscules

class ItemCondition(str, enum.Enum):
    NEW = "new"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"

class ItemStatus(str, enum.Enum):
    ACTIVE = "active"
    RESERVED = "reserved"
    GIVEN = "given"
    EXPIRED = "expired"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user", nullable=False)
    #role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    avatar = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    rating = Column(DECIMAL(3,2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    items = relationship("Item", back_populates="owner", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    conversations = relationship("ConversationParticipant", back_populates="user")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    icon = Column(String(50), nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    items = relationship("Item", back_populates="category")

class Item(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    condition = Column('item_condition', Enum(ItemCondition, values_callable=lambda obj: [e.value for e in obj], native_enum=False), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    location_lat = Column(DECIMAL(10,8), nullable=True)
    location_lng = Column(DECIMAL(11,8), nullable=True)
    location_address = Column(Text, nullable=True)
    location_city = Column(String(100), nullable=True)
    location_postal_code = Column(String(10), nullable=True)
    pickup_only = Column(Boolean, default=True)
    views = Column(Integer, default=0)
    status = Column('item_status', Enum(ItemStatus, values_callable=lambda obj: [e.value for e in obj], native_enum=False), default=ItemStatus.ACTIVE.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relations
    owner = relationship("User", back_populates="items")
    category = relationship("Category", back_populates="items")
    images = relationship("ItemImage", back_populates="item", cascade="all, delete-orphan")
    favorited_by = relationship("Favorite", back_populates="item", cascade="all, delete-orphan")
    tags = relationship("ItemTag", back_populates="item", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="item")

class ItemImage(Base):
    __tablename__ = "item_images"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    image_url = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    item = relationship("Item", back_populates="images")

class Favorite(Base):
    __tablename__ = "favorites"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    item_id = Column(Integer, ForeignKey("items.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    user = relationship("User", back_populates="favorites")
    item = relationship("Item", back_populates="favorited_by")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relations
    item = relationship("Item", back_populates="conversations")
    participants = relationship("ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"
    
    conversation_id = Column(Integer, ForeignKey("conversations.id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User", back_populates="conversations")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")


class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=False)
    file_url = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relations
    message = relationship("Message", back_populates="attachments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # recipient
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # who caused the notification
    type = Column(String(50), nullable=False)
    data = Column(Text, nullable=True)  # optional JSON payload
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relations
    items = relationship("ItemTag", back_populates="tag", cascade="all, delete-orphan")

class ItemTag(Base):
    __tablename__ = "item_tags"
    
    item_id = Column(Integer, ForeignKey("items.id"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("tags.id"), primary_key=True)
    
    # Relations
    item = relationship("Item", back_populates="tags")
    tag = relationship("Tag", back_populates="items")