"""
Neural Canvas Backend - Reel Model
Stores saved reel sequences.
"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Reel(Base):
    """Saved reel model - mirrors frontend SavedReel type."""
    
    __tablename__ = "reels"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    # Sequence data (array of asset IDs with order)
    sequence: Mapped[list] = mapped_column(JSON, default=list)
    
    # Theme reference
    theme_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    
    # Playback settings
    settings: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Thumbnail (first frame preview)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="reels")
