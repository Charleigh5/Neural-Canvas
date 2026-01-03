"""
Neural Canvas Backend - User Schemas
Pydantic models for user input/output validation.
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict


class UserBase(BaseModel):
    """Shared user properties."""
    email: EmailStr
    display_name: str | None = None


class UserCreate(UserBase):
    """Properties for user registration."""
    password: str


class UserUpdate(BaseModel):
    """Properties for updating user profile."""
    display_name: str | None = None
    avatar_url: str | None = None


class UserResponse(UserBase):
    """User response model (public)."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    avatar_url: str | None = None
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserInDB(UserResponse):
    """User model with hashed password (internal)."""
    hashed_password: str
