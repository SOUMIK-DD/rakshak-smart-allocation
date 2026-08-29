"""FastAPI application — Smart Hospital Allocation backend."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import init_db, get_session
from models import DashboardStats
import database as db
from routers import hospitals, victims, allocation, history, buildings, drills, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
    
    # Create default admin user if no users exist
    from db_session import async_session_factory
    from db_models import UserRow
    from sqlalchemy import select
    from auth import hash_password
    import uuid
    
    async with async_session_factory() as session:
        result = await session.execute(select(UserRow).limit(1))
        if not result.scalar_one_or_none():
            admin = UserRow(
                id=str(uuid.uuid4()),
                username="admin",
                hashed_password=hash_password("admin123"),
                role="admin",
            )
            session.add(admin)
            await session.commit()
    
    yield


app = FastAPI(
    title="Rakshak — Disaster Management System",
    description="Comprehensive disaster management with smart hospital allocation, "
    "indoor emergency modeling, evacuation drills, and undo/redo.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(hospitals.router)
app.include_router(victims.router)
app.include_router(allocation.router)
app.include_router(history.router)
app.include_router(buildings.router)
app.include_router(drills.router)


# ---------------------------------------------------------------------------
# Health / ping endpoints (no DB, fast response for keep-alive)
# ---------------------------------------------------------------------------
@app.get("/api/ping")
async def ping():
    return {"status": "ok", "message": "Rakshak is alive!"}


@app.get("/api/seed", tags=["seed"])
async def check_seed(session: AsyncSession = Depends(get_session)):
    """Check if data is seeded."""
    hospitals_list = await db.list_hospitals(session)
    return {"seeded": len(hospitals_list) > 0, "hospitals": len(hospitals_list)}


@app.post("/api/seed", tags=["seed"])
async def seed_data(session: AsyncSession = Depends(get_session)):
    """Seed demo data if database is empty."""
    result = await db.seed_demo_data(session)
    await session.commit()
    return result


@app.get("/api/stats", response_model=DashboardStats, tags=["stats"])
async def get_stats(session: AsyncSession = Depends(get_session)):
    """Dashboard summary statistics."""
    hospitals_list = await db.list_hospitals(session)
    victims_list = await db.list_victims(session)
    assigned = [v for v in victims_list if v.assigned_hospital_id is not None]

    total_beds = sum(h.total_beds for h in hospitals_list)
    avail_beds = sum(h.available_beds for h in hospitals_list)
    total_icu = sum(h.icu_beds for h in hospitals_list)
    icu_avail = sum(h.icu_available for h in hospitals_list)

    return DashboardStats(
        total_hospitals=len(hospitals_list),
        total_beds=total_beds,
        available_beds=avail_beds,
        total_icu=total_icu,
        icu_available=icu_avail,
        total_victims=len(victims_list),
        unassigned_victims=len(victims_list) - len(assigned),
        assigned_victims=len(assigned),
        utilization_pct=round((1 - avail_beds / total_beds) * 100, 1) if total_beds else 0.0,
        icu_utilization_pct=round((1 - icu_avail / total_icu) * 100, 1) if total_icu else 0.0,
    )


@app.get("/api/results")
async def get_results(session: AsyncSession = Depends(get_session)):
    """List all allocation results."""
    return await db.list_allocation_results(session)


# ---------------------------------------------------------------------------
# Serve frontend static files (built React app)
# Must be LAST — catch-all must not override API routes
# ---------------------------------------------------------------------------
STATIC_DIR = Path(__file__).parent / "static"

if STATIC_DIR.is_dir():
    # Serve JS/CSS assets with cache headers
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """Catch-all: serve index.html for SPA routing, or static files.
        
        IMPORTANT: API routes registered above take priority over this catch-all.
        """
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")
