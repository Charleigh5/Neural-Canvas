"""
Neural Canvas Backend - Async Migration Runner
Per Context7/Alembic best practices: Run migrations with async SQLAlchemy engine.
"""

import asyncio
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine
from alembic import command
from alembic.config import Config

from app.config import settings


def run_upgrade(connection, cfg):
    """Run Alembic upgrade within sync context."""
    cfg.attributes["connection"] = connection
    command.upgrade(cfg, "head")


def run_downgrade(connection, cfg, revision: str = "-1"):
    """Run Alembic downgrade within sync context."""
    cfg.attributes["connection"] = connection
    command.downgrade(cfg, revision)


async def run_async_migrations(direction: str = "upgrade", revision: str = "head"):
    """
    Run Alembic migrations asynchronously.
    Per Context7: Uses async engine with run_sync for migration commands.
    
    Args:
        direction: 'upgrade' or 'downgrade'
        revision: Target revision ('head', '-1', specific revision id)
    """
    # Create async engine from settings
    async_engine = create_async_engine(
        settings.database_url,
        echo=True,
    )
    
    # Load Alembic config
    alembic_cfg = Config("alembic.ini")
    
    print(f"🔄 Running {direction} to {revision}...")
    
    async with async_engine.begin() as conn:
        if direction == "upgrade":
            await conn.run_sync(run_upgrade, alembic_cfg)
        elif direction == "downgrade":
            await conn.run_sync(run_downgrade, alembic_cfg, revision)
    
    await async_engine.dispose()
    print(f"✅ Migration {direction} complete!")


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Run Alembic migrations async")
    parser.add_argument(
        "command",
        choices=["upgrade", "downgrade"],
        help="Migration direction",
    )
    parser.add_argument(
        "--revision",
        default="head",
        help="Target revision (default: head for upgrade, -1 for downgrade)",
    )
    
    args = parser.parse_args()
    
    # Set default revision for downgrade
    if args.command == "downgrade" and args.revision == "head":
        args.revision = "-1"
    
    asyncio.run(run_async_migrations(args.command, args.revision))


if __name__ == "__main__":
    main()
