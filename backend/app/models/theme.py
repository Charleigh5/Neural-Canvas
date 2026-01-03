"""
Neural Canvas Backend - Theme Model
Stores visual themes for presentations.
"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Theme(Base):
    """Theme configuration model - mirrors frontend ThemeConfig type."""
    
    __tablename__ = "themes"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    
    # Theme configuration (colors, fonts, effects)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Preview image
    preview_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Is this a system preset?
    is_preset: Mapped[bool] = mapped_column(default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="themes")
