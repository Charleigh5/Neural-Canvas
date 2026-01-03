"""
Neural Canvas Backend - Assets Endpoint Tests
Tests for /assets CRUD operations with authentication.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset


# === FIXTURES ===

@pytest_asyncio.fixture
async def test_asset(db_session: AsyncSession, test_user) -> Asset:
    """Create a test asset owned by test_user."""
    asset = Asset(
        id="test-asset-id-123",
        owner_id=test_user.id,
        storage_url="https://example.com/test-image.jpg",
        original_filename="test-image.jpg",
        mime_type="image/jpeg",
        width=1920,
        height=1080,
        tags=["test", "sample"],
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    return asset


# === LIST ASSETS ===

@pytest.mark.asyncio
async def test_list_assets_unauthorized(async_client: AsyncClient):
    """Test listing assets without auth returns 401."""
    response = await async_client.get("/assets")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_assets_empty(authenticated_client: AsyncClient):
    """Test listing assets when user has none."""
    response = await authenticated_client.get("/assets")
    
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_list_assets_with_data(authenticated_client: AsyncClient, test_asset):
    """Test listing assets returns user's assets."""
    response = await authenticated_client.get("/assets")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == test_asset.id


# === CREATE ASSET ===

@pytest.mark.asyncio
async def test_create_asset_success(authenticated_client: AsyncClient):
    """Test creating a new asset."""
    response = await authenticated_client.post(
        "/assets",
        json={
            "storage_url": "https://example.com/new-image.png",
            "original_filename": "new-image.png",
            "mime_type": "image/png",
            "width": 800,
            "height": 600,
            "tags": ["new", "uploaded"],
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "new-image.png"
    assert "uploaded" in data["tags"]
    assert "id" in data


@pytest.mark.asyncio
async def test_create_asset_unauthorized(async_client: AsyncClient):
    """Test creating asset without auth returns 401."""
    response = await async_client.post(
        "/assets",
        json={
            "storage_url": "https://example.com/image.png",
            "width": 800,
            "height": 600,
        },
    )
    assert response.status_code == 401


# === GET ASSET ===

@pytest.mark.asyncio
async def test_get_asset_success(authenticated_client: AsyncClient, test_asset):
    """Test getting a specific asset."""
    response = await authenticated_client.get(f"/assets/{test_asset.id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_asset.id
    assert data["original_filename"] == test_asset.original_filename


@pytest.mark.asyncio
async def test_get_asset_not_found(authenticated_client: AsyncClient):
    """Test getting non-existent asset returns 404."""
    response = await authenticated_client.get("/assets/nonexistent-id")
    assert response.status_code == 404


# === UPDATE ASSET ===

@pytest.mark.asyncio
async def test_update_asset_success(authenticated_client: AsyncClient, test_asset):
    """Test updating an asset."""
    response = await authenticated_client.patch(
        f"/assets/{test_asset.id}",
        json={"tags": ["updated", "modified"]},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "updated" in data["tags"]


@pytest.mark.asyncio
async def test_update_asset_not_found(authenticated_client: AsyncClient):
    """Test updating non-existent asset returns 404."""
    response = await authenticated_client.patch(
        "/assets/nonexistent-id",
        json={"tags": ["new"]},
    )
    assert response.status_code == 404


# === DELETE ASSET ===

@pytest.mark.asyncio
async def test_delete_asset_success(authenticated_client: AsyncClient, test_asset):
    """Test deleting an asset."""
    response = await authenticated_client.delete(f"/assets/{test_asset.id}")
    assert response.status_code == 204
    
    # Verify deleted
    get_response = await authenticated_client.get(f"/assets/{test_asset.id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_asset_not_found(authenticated_client: AsyncClient):
    """Test deleting non-existent asset returns 404."""
    response = await authenticated_client.delete("/assets/nonexistent-id")
    assert response.status_code == 404
