"""
Neural Canvas Backend - Auth Schemas
Pydantic models for authentication.
"""

from pydantic import BaseModel


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str  # User ID
    exp: int  # Expiration timestamp
    type: str  # "access" or "refresh"


class LoginRequest(BaseModel):
    """Login credentials."""
    email: str
    password: str


class RefreshRequest(BaseModel):
    """Token refresh request."""
    refresh_token: str
