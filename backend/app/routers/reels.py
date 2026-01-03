from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, schemas
from app.dependencies import get_current_active_user, get_db
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Reel])
async def read_reels(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve reels.
    """
    reels = await crud.reel.get_multi_by_owner(
        db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return reels

@router.post("/", response_model=schemas.Reel)
async def create_reel(
    *,
    db: AsyncSession = Depends(get_db),
    reel_in: schemas.ReelCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new reel.
    """
    reel = await crud.reel.create(db=db, obj_in=reel_in, owner_id=current_user.id)
    return reel

@router.get("/{reel_id}", response_model=schemas.Reel)
async def read_reel(
    *,
    db: AsyncSession = Depends(get_db),
    reel_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get reel by ID.
    """
    reel = await crud.reel.get(db=db, id=reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    if reel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return reel

@router.put("/{reel_id}", response_model=schemas.Reel)
async def update_reel(
    *,
    db: AsyncSession = Depends(get_db),
    reel_id: str,
    reel_in: schemas.ReelUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a reel.
    """
    reel = await crud.reel.get(db=db, id=reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    if reel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    reel = await crud.reel.update(db=db, db_obj=reel, obj_in=reel_in)
    return reel

@router.delete("/{reel_id}", response_model=schemas.Reel)
async def delete_reel(
    *,
    db: AsyncSession = Depends(get_db),
    reel_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a reel.
    """
    reel = await crud.reel.get(db=db, id=reel_id)
    if not reel:
        raise HTTPException(status_code=404, detail="Reel not found")
    if reel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    reel = await crud.reel.remove(db=db, id=reel_id)
    return reel
