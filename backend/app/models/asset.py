"""
Neural Canvas Backend - Asset Model
Stores image metadata (actual files stored in cloud storage).
Supports versioning: Original assets can have multiple edited versions.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List
from sqlalchemy import String, DateTime, Integer, Float, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Asset(Base):
    """
    Image asset model - mirrors frontend ImageAsset type.
    Supports versioning via self-referential parent_id relationship.
    """
    
    __tablename__ = "assets"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    owner_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    
    # === VERSIONING (NEW) ===
    parent_id: Mapped[Optional[str]] = mapped_column(
        String(36), ForeignKey("assets.id", ondelete="SET NULL"), nullable=True, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, default=1)
    is_original: Mapped[bool] = mapped_column(Boolean, default=True)
    processing_status: Mapped[str] = mapped_column(
        String(20), default="completed"
    )  # pending, processing, failed, completed
    
    # Storage
    storage_url: Mapped[str] = mapped_column(String(500))  # Cloud storage URL
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Dimensions
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    
    # Canvas position (for saving workspace state)
    x: Mapped[float] = mapped_column(Float, default=0)
    y: Mapped[float] = mapped_column(Float, default=0)
    scale: Mapped[float] = mapped_column(Float, default=1)
    rotation: Mapped[float] = mapped_column(Float, default=0)
    
    # AI Analysis
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    local_tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    caption: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analyzed: Mapped[bool] = mapped_column(default=False)
    
    # Metadata
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="assets")
    
    # Self-referential: Original -> Versions
    versions: Mapped[List["Asset"]] = relationship(
        "Asset",
        backref="parent",  # type: ignore
        remote_side=[id],
        foreign_keys=[parent_id],
    )

