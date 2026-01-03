"""
Neural Canvas Backend - User Model
"""

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.asset import Asset
    from app.models.reel import Reel
    from app.models.theme import Theme


class User(Base):
    """User account model."""
    
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    assets: Mapped[list["Asset"]] = relationship(
        "Asset", back_populates="owner", cascade="all, delete-orphan"
    )
    reels: Mapped[list["Reel"]] = relationship(
        "Reel", back_populates="owner", cascade="all, delete-orphan"
    )
    themes: Mapped[list["Theme"]] = relationship(
        "Theme", back_populates="owner", cascade="all, delete-orphan"
    )
