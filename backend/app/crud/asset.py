"""
Neural Canvas Backend - Asset CRUD Operations
"""

import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.schemas.asset import AssetCreate, AssetUpdate


async def get_assets_by_owner(
    db: AsyncSession, owner_id: str, skip: int = 0, limit: int = 100
) -> list[Asset]:
    """Get all assets for a user."""
    result = await db.execute(
        select(Asset)
        .where(Asset.owner_id == owner_id)
        .offset(skip)
        .limit(limit)
        .order_by(Asset.created_at.desc())
    )
    return list(result.scalars().all())


async def get_asset_by_id(
    db: AsyncSession, asset_id: str, owner_id: str
) -> Asset | None:
    """Get a specific asset by ID (scoped to owner)."""
    result = await db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.owner_id == owner_id)
    )
    return result.scalar_one_or_none()


async def create_asset(
    db: AsyncSession, asset_in: AssetCreate, owner_id: str
) -> Asset:
    """Create a new asset."""
    asset = Asset(
        id=str(uuid.uuid4()),
        owner_id=owner_id,
        **asset_in.model_dump(),
    )
    db.add(asset)
    await db.flush()
    await db.refresh(asset)
    return asset


async def update_asset(
    db: AsyncSession, asset: Asset, update_data: AssetUpdate
) -> Asset:
    """Update an asset."""
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(asset, field, value)
    await db.flush()
    await db.refresh(asset)
    return asset


async def delete_asset(db: AsyncSession, asset: Asset) -> None:
    """Delete an asset."""
    await db.delete(asset)
    await db.flush()
