"""
Neural Canvas Backend - Users Router
User profile endpoints.
"""

from fastapi import APIRouter, Depends

from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.dependencies import get_current_active_user


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get the current user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Update the current user's profile."""
    # Update fields
    if update_data.display_name is not None:
        current_user.display_name = update_data.display_name
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    
    return UserResponse.model_validate(current_user)
