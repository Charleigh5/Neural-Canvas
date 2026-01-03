"""
Neural Canvas Backend - Test Configuration
Pytest fixtures for async testing with SQLite in-memory database.
No Docker required - pure Python testing environment.
"""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# App imports
from app.main import app
from app.database import get_async_db, Base
from app.services.auth_service import get_password_hash, create_tokens
from app.models.user import User


# === DATABASE FIXTURES ===

# SQLite in-memory for fast, isolated tests (no Docker needed)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create fresh test database engine for each test."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}  # SQLite specific
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Async database session with auto-rollback."""
    async_session_factory = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        yield session
        await session.rollback()


# === CLIENT FIXTURES ===

@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client with test database injection."""
    
    # Override the database dependency
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_async_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    # Cleanup
    app.dependency_overrides.clear()


# === USER FIXTURES ===

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user in the database."""
    user = User(
        id="test-user-id-123",
        email="test@example.com",
        hashed_password=get_password_hash("testpassword123"),
        display_name="Test User",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict[str, str]:
    """Get authorization headers for authenticated requests."""
    access_token, _ = create_tokens(test_user.id)
    return {"Authorization": f"Bearer {access_token}"}


@pytest_asyncio.fixture
async def authenticated_client(
    async_client: AsyncClient,
    auth_headers: dict[str, str],
) -> AsyncClient:
    """Client with auth headers pre-configured."""
    async_client.headers.update(auth_headers)
    return async_client
