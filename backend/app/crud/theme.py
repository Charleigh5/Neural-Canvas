from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.models.theme import Theme
from app.schemas.theme import ThemeCreate, ThemeUpdate

class CRUDTheme(CRUDBase[Theme, ThemeCreate, ThemeUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: str, skip: int = 0, limit: int = 100
    ) -> List[Theme]:
        query = select(self.model).filter(self.model.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_details(
        self, db: AsyncSession, *, theme_id: str
    ) -> Theme:
        query = select(self.model).filter(self.model.id == theme_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
        
theme = CRUDTheme(Theme)
