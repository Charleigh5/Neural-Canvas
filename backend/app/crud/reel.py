from typing import Any, Dict, Optional, Union, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.crud.base import CRUDBase
from app.models.reel import Reel
from app.schemas.reel import ReelCreate, ReelUpdate

class CRUDReel(CRUDBase[Reel, ReelCreate, ReelUpdate]):
    async def get_multi_by_owner(
        self, db: AsyncSession, *, owner_id: str, skip: int = 0, limit: int = 100
    ) -> List[Reel]:
        query = select(self.model).filter(self.model.owner_id == owner_id).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

reel = CRUDReel(Reel)
