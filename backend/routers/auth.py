"""Authentication endpoints — login, register, current user."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import get_session
from auth import hash_password, verify_password, create_access_token, get_current_user
import database as db

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / Response models (inline to avoid circular imports)
# ---------------------------------------------------------------------------

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: str = Field(default="operator")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    username: str
    role: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)):
    """Register a new user."""
    # Check if username already exists
    existing = await db.get_user_by_username(session, payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    # Validate role
    if payload.role not in ("admin", "operator", "viewer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be admin, operator, or viewer",
        )

    # Create user
    user_id = str(uuid.uuid4())
    hashed = hash_password(payload.password)
    await db.create_user(session, user_id, payload.username, hashed, payload.role)
    await session.commit()

    # Generate token
    token = create_access_token(data={"sub": payload.username, "role": payload.role})

    return TokenResponse(
        access_token=token,
        user={"id": user_id, "username": payload.username, "role": payload.role},
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)):
    """Login with username and password."""
    user = await db.get_user_by_username(session, payload.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(data={"sub": user["username"], "role": user["role"]})

    return TokenResponse(
        access_token=token,
        user={"id": user["id"], "username": user["username"], "role": user["role"]},
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
    )
