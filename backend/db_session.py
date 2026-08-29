"""Async SQLAlchemy session factory for SQLite database."""

from __future__ import annotations

import os
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from db_models import Base

# Database URL — read from env or default to local SQLite
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./disaster_management.db",
)

# Ensure the parent directory of the DB file exists (needed for Docker volume mount)
_db_path = DATABASE_URL.split("///", 1)[-1] if "///" in DATABASE_URL else ""
if _db_path and not _db_path.startswith(":memory:"):
    _db_dir = os.path.dirname(_db_path)
    if _db_dir:
        os.makedirs(_db_dir, exist_ok=True)

# Create async engine
engine = create_async_engine(DATABASE_URL, echo=False, future=True)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autobegin=True,
)


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session():
    """FastAPI dependency — yields a bare session (no context manager).

    Route handlers must call await session.commit() explicitly.
    """
    session = async_session_factory()
    try:
        yield session
    except Exception:
        if session.is_active:
            await session.rollback()
        raise
    finally:
        await session.close()
