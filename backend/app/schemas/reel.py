from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ReelBase(BaseModel):
    name: str
    description: Optional[str] = None
    sequence: List[Any] = []  # JSON list of sequence items
    theme_id: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    thumbnail_url: Optional[str] = None

class ReelCreate(ReelBase):
    pass

class ReelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sequence: Optional[List[Any]] = None
    theme_id: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    thumbnail_url: Optional[str] = None

class Reel(ReelBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
