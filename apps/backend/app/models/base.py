"""
Base Model for all SQLAlchemy models
Provides common fields and functionality
"""
from datetime import datetime
from sqlalchemy import Column, DateTime, Boolean, Uuid as UUID, text
import uuid
from app.database import Base


class BaseModel(Base):
    """
    Abstract base model with common fields.
    All models should inherit from this.
    """
    
    __abstract__ = True
    
    # Primary key - UUID for better distribution and security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Timestamps
    created_at = Column(DateTime, server_default=text('now()'), nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)
    
    # Soft delete flag
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    
    def to_dict(self) -> dict:
        """
        Convert model instance to dictionary.
        Useful for serialization.
        """
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }
    
    def __repr__(self) -> str:
        """String representation of the model"""
        return f"<{self.__class__.__name__} {self.id}>"
