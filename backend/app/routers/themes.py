from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, schemas
from app.dependencies import get_current_active_user, get_db
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[schemas.Theme])
async def read_themes(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Retrieve themes.
    """
    themes = await crud.theme.get_multi_by_owner(
        db, owner_id=current_user.id, skip=skip, limit=limit
    )
    return themes

@router.post("/", response_model=schemas.Theme)
async def create_theme(
    *,
    db: AsyncSession = Depends(get_db),
    theme_in: schemas.ThemeCreate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create new theme.
    """
    theme = await crud.theme.create(db=db, obj_in=theme_in, owner_id=current_user.id)
    return theme

@router.get("/{theme_id}", response_model=schemas.Theme)
async def read_theme(
    *,
    db: AsyncSession = Depends(get_db),
    theme_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get theme by ID.
    """
    theme = await crud.theme.get(db=db, id=theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    # Allow reading if owner matches or if it is a system preset
    if theme.owner_id != current_user.id and not theme.is_preset:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return theme

@router.put("/{theme_id}", response_model=schemas.Theme)
async def update_theme(
    *,
    db: AsyncSession = Depends(get_db),
    theme_id: str,
    theme_in: schemas.ThemeUpdate,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update a theme.
    """
    theme = await crud.theme.get(db=db, id=theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    if theme.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    theme = await crud.theme.update(db=db, db_obj=theme, obj_in=theme_in)
    return theme

@router.delete("/{theme_id}", response_model=schemas.Theme)
async def delete_theme(
    *,
    db: AsyncSession = Depends(get_db),
    theme_id: str,
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Delete a theme.
    """
    theme = await crud.theme.get(db=db, id=theme_id)
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    if theme.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    theme = await crud.theme.remove(db=db, id=theme_id)
    return theme
