"""
Neural Canvas Backend - Auth Endpoint Tests
Tests for /auth/register, /auth/login, and /auth/refresh endpoints.
"""

import pytest
from httpx import AsyncClient


# === REGISTRATION TESTS ===

@pytest.mark.asyncio
async def test_register_success(async_client: AsyncClient):
    """Test successful user registration."""
    response = await async_client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "securepassword123",
            "display_name": "New User",
        },
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["display_name"] == "New User"
    assert "id" in data
    assert "hashed_password" not in data  # Security: password not exposed


@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient, test_user):
    """Test registration fails for duplicate email."""
    response = await async_client.post(
        "/auth/register",
        json={
            "email": test_user.email,  # Already exists
            "password": "anotherpassword",
            "display_name": "Duplicate User",
        },
    )
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_invalid_email(async_client: AsyncClient):
    """Test registration fails for invalid email format."""
    response = await async_client.post(
        "/auth/register",
        json={
            "email": "not-an-email",
            "password": "validpassword",
            "display_name": "Invalid Email User",
        },
    )
    
    assert response.status_code == 422  # Validation error


# === LOGIN TESTS ===

@pytest.mark.asyncio
async def test_login_success(async_client: AsyncClient, test_user):
    """Test successful login returns JWT tokens."""
    response = await async_client.post(
        "/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(async_client: AsyncClient, test_user):
    """Test login fails with incorrect password."""
    response = await async_client.post(
        "/auth/login",
        json={
            "email": test_user.email,
            "password": "wrongpassword",
        },
    )
    
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(async_client: AsyncClient):
    """Test login fails for non-existent user."""
    response = await async_client.post(
        "/auth/login",
        json={
            "email": "nobody@example.com",
            "password": "anypassword",
        },
    )
    
    assert response.status_code == 401


# === TOKEN REFRESH TESTS ===

@pytest.mark.asyncio
async def test_refresh_token_success(async_client: AsyncClient, test_user):
    """Test refresh token returns new access token."""
    # First login to get tokens
    login_response = await async_client.post(
        "/auth/login",
        json={
            "email": test_user.email,
            "password": "testpassword123",
        },
    )
    refresh_token = login_response.json()["refresh_token"]
    
    # Use refresh token
    response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_refresh_token_invalid(async_client: AsyncClient):
    """Test refresh fails with invalid token."""
    response = await async_client.post(
        "/auth/refresh",
        json={"refresh_token": "invalid-token"},
    )
    
    assert response.status_code == 401
