"""Evacuation drill management and simulation endpoints."""

from __future__ import annotations

import random
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import get_session
from models import Drill, DrillCreate, DrillStatus, DrillReport
import database as db

router = APIRouter(prefix="/api/drills", tags=["drills"])


@router.get("", response_model=list[Drill])
async def list_drills(session: AsyncSession = Depends(get_session)):
    return await db.list_drills(session)


@router.get("/{drill_id}", response_model=Drill)
async def get_drill(drill_id: str, session: AsyncSession = Depends(get_session)):
    d = await db.get_drill(session, drill_id)
    if not d:
        raise HTTPException(status_code=404, detail="Drill not found")
    return d


@router.post("", response_model=Drill, status_code=201)
async def create_drill(payload: DrillCreate, session: AsyncSession = Depends(get_session)):
    """Create a new evacuation drill."""
    building = await db.get_building(session, payload.building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    # First, compute total participants by counting room occupants
    floors = await db.get_floors_for_building(session, payload.building_id)
    total_participants = 0
    participant_list = []

    for floor in floors:
        rooms = await db.get_rooms_for_floor(session, floor.id)
        for room in rooms:
            if room.occupancy > 0 and not room.is_exit and not room.is_stairwell:
                num_participants = min(room.occupancy, random.randint(3, 8))
                for i in range(num_participants):
                    participant_list.append({
                        "id": str(uuid.uuid4()),
                        "drill_id": "",  # will fill after drill is created
                        "room_id": room.id,
                        "person_name": f"Person {total_participants + 1}",
                        "evacuated": False,
                        "evacuation_time": 0.0,
                        "path_taken": [],
                    })
                    total_participants += 1

    # Create drill with known total_participants
    d = Drill(**payload.model_dump())
    d.total_participants = total_participants
    await db.create_drill(session, d, total_participants)
    await session.commit()

    # Now create participants in a second transaction
    for p in participant_list:
        p["drill_id"] = d.id
        await db.create_drill_participant(session, p)
    await session.commit()

    return d


@router.post("/{drill_id}/start", response_model=DrillStatus)
async def start_drill(drill_id: str, session: AsyncSession = Depends(get_session)):
    """Start an evacuation drill."""
    d = await db.get_drill(session, drill_id)
    if not d:
        raise HTTPException(status_code=404, detail="Drill not found")
    if d.status != "pending":
        raise HTTPException(status_code=400, detail="Drill already started or completed")

    await db.update_drill(session, drill_id, {
        "status": "active",
        "started_at": datetime.utcnow(),
    })
    await session.commit()

    d = await db.get_drill(session, drill_id)

    return DrillStatus(
        drill=d,
        participants_evacuated=0,
        participants_remaining=d.total_participants,
        elapsed_seconds=0,
        current_phase="evacuation_started",
    )


@router.post("/{drill_id}/tick", response_model=DrillStatus)
async def tick_drill(drill_id: str, session: AsyncSession = Depends(get_session)):
    """Advance the drill simulation by one tick."""
    d = await db.get_drill(session, drill_id)
    if not d:
        raise HTTPException(status_code=404, detail="Drill not found")
    if d.status != "active":
        raise HTTPException(status_code=400, detail="Drill is not active")

    participants = await db.get_drill_participants(session, drill_id)

    evacuated_this_tick = 0
    for p in participants:
        if not p.evacuated:
            if random.random() < 0.3:
                await db.update_drill_participant(session, p.id, {
                    "evacuated": True,
                    "evacuation_time": random.uniform(30, 120),
                })
                evacuated_this_tick += 1

    # Re-fetch participants to get accurate count
    participants = await db.get_drill_participants(session, drill_id)
    evacuated_count = sum(1 for p in participants if p.evacuated)
    elapsed = (datetime.utcnow() - d.started_at).total_seconds() if d.started_at else 0

    if evacuated_count >= d.total_participants:
        await db.update_drill(session, drill_id, {
            "status": "completed",
            "completed_at": datetime.utcnow(),
            "evacuated_count": evacuated_count,
            "evacuation_time_seconds": elapsed,
        })
        current_phase = "completed"
    else:
        await db.update_drill(session, drill_id, {"evacuated_count": evacuated_count})
        current_phase = "evacuating"

    await session.commit()

    d = await db.get_drill(session, drill_id)

    return DrillStatus(
        drill=d,
        participants_evacuated=evacuated_count,
        participants_remaining=d.total_participants - evacuated_count,
        elapsed_seconds=elapsed,
        current_phase=current_phase,
    )


@router.get("/{drill_id}/status", response_model=DrillStatus)
async def get_drill_status(drill_id: str, session: AsyncSession = Depends(get_session)):
    """Get current drill status."""
    d = await db.get_drill(session, drill_id)
    if not d:
        raise HTTPException(status_code=404, detail="Drill not found")

    participants = await db.get_drill_participants(session, drill_id)
    evacuated_count = sum(1 for p in participants if p.evacuated)
    elapsed = (datetime.utcnow() - d.started_at).total_seconds() if d.started_at else 0

    return DrillStatus(
        drill=d,
        participants_evacuated=evacuated_count,
        participants_remaining=d.total_participants - evacuated_count,
        elapsed_seconds=elapsed,
        current_phase=d.status,
    )


@router.get("/{drill_id}/report", response_model=DrillReport)
async def get_drill_report(drill_id: str, session: AsyncSession = Depends(get_session)):
    """Generate a post-drill report."""
    d = await db.get_drill(session, drill_id)
    if not d:
        raise HTTPException(status_code=404, detail="Drill not found")
    if d.status != "completed":
        raise HTTPException(status_code=400, detail="Drill not completed yet")

    participants = await db.get_drill_participants(session, drill_id)

    evacuation_times = [p.evacuation_time for p in participants if p.evacuated]
    avg_time = sum(evacuation_times) / len(evacuation_times) if evacuation_times else 0

    floor_times = {}
    for i in range(1, 6):
        floor_times[i] = random.uniform(60, 180)

    bottlenecks = []
    if avg_time > 90:
        bottlenecks.append("Long evacuation times suggest narrow corridors")
    if d.evacuation_time_seconds > 300:
        bottlenecks.append("Total evacuation time exceeds 5 minutes")

    recommendations = []
    if avg_time > 60:
        recommendations.append("Consider adding more emergency exits")
    if d.evacuated_count < d.total_participants:
        recommendations.append("Improve emergency communication systems")
    recommendations.append("Conduct regular evacuation drills")

    success_rate = (d.evacuated_count / d.total_participants * 100) if d.total_participants > 0 else 0

    return DrillReport(
        drill=d,
        total_time_seconds=d.evacuation_time_seconds,
        avg_evacuation_time=avg_time,
        floor_times=floor_times,
        bottlenecks=bottlenecks,
        recommendations=recommendations,
        success_rate=round(success_rate, 1),
    )
