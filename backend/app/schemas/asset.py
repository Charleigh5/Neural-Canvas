"""
Neural Canvas Backend - Asset Schemas
Pydantic models for asset input/output validation.
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AssetBase(BaseModel):
    """Shared asset properties."""
    width: int
    height: int
    x: float = 0
    y: float = 0
    scale: float = 1
    rotation: float = 0
    tags: list[str] | None = None
    local_tags: list[str] | None = None
    caption: str | None = None


class AssetCreate(AssetBase):
    """Properties for creating an asset."""
    storage_url: str
    original_filename: str | None = None
    mime_type: str | None = None
    file_size: int | None = None


class AssetUpdate(BaseModel):
    """Properties for updating an asset."""
    x: float | None = None
    y: float | None = None
    scale: float | None = None
    rotation: float | None = None
    tags: list[str] | None = None
    caption: str | None = None
    analyzed: bool | None = None


class AssetResponse(AssetBase):
    """Asset response model."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    owner_id: str
    storage_url: str
    thumbnail_url: str | None = None
    analyzed: bool
    original_filename: str | None = None
    mime_type: str | None = None
    file_size: int | None = None
    created_at: datetime
    updated_at: datetime
