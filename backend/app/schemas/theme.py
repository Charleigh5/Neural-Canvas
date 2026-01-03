from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class ThemeBase(BaseModel):
    name: str
    description: Optional[str] = None
    config: Dict[str, Any] = {}
    preview_url: Optional[str] = None
    is_preset: bool = False

class ThemeCreate(ThemeBase):
    pass

class ThemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    preview_url: Optional[str] = None
    is_preset: Optional[bool] = None

class Theme(ThemeBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
