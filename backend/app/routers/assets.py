"""
Neural Canvas Backend - Assets Router
Asset CRUD endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_async_db
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.crud.asset import (
    get_assets_by_owner,
    get_asset_by_id,
    create_asset,
    update_asset,
    delete_asset,
)
from app.dependencies import get_current_active_user


router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=list[AssetResponse])
async def list_assets(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> list[AssetResponse]:
    """List all assets for the current user."""
    assets = await get_assets_by_owner(db, current_user.id, skip=skip, limit=limit)
    return [AssetResponse.model_validate(asset) for asset in assets]


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_new_asset(
    asset_in: AssetCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> AssetResponse:
    """Create a new asset."""
    asset = await create_asset(db, asset_in, current_user.id)
    return AssetResponse.model_validate(asset)


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> AssetResponse:
    """Get a specific asset by ID."""
    asset = await get_asset_by_id(db, asset_id, current_user.id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    return AssetResponse.model_validate(asset)


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_existing_asset(
    asset_id: str,
    update_data: AssetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> AssetResponse:
    """Update an asset."""
    asset = await get_asset_by_id(db, asset_id, current_user.id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    
    updated_asset = await update_asset(db, asset, update_data)
    return AssetResponse.model_validate(updated_asset)


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_asset(
    asset_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_async_db),
) -> None:
    """Delete an asset."""
    asset = await get_asset_by_id(db, asset_id, current_user.id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    
    await delete_asset(db, asset)
