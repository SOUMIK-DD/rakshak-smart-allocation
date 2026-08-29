"""Allocation endpoints using async SQLAlchemy."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import get_session
from models import AllocationResult, AllocationStats, Severity
import database as db
from scoring import find_best_hospital

router = APIRouter(prefix="/api/allocate", tags=["allocation"])

_SEVERITY_ORDER = {
    Severity.CRITICAL: 0,
    Severity.SEVERE: 1,
    Severity.MODERATE: 2,
    Severity.MILD: 3,
}


@router.post("", response_model=AllocationStats)
async def allocate_all(session: AsyncSession = Depends(get_session)):
    """Allocate ALL unassigned victims to hospitals (batch mode)."""
    victims = await db.list_unassigned_victims(session)
    hospitals = await db.list_hospitals(session)

    if not victims:
        raise HTTPException(status_code=400, detail="No unassigned victims")

    victims.sort(key=lambda v: _SEVERITY_ORDER.get(v.severity, 99))

    results: list[AllocationResult] = []

    for idx, victim in enumerate(victims):
        best = await find_best_hospital(victim, hospitals)
        if best is None:
            continue

        h = best.hospital

        # Mark victim as assigned
        await db.update_victim(session, victim.id, {"assigned_hospital_id": h.id})

        # Decrement capacity (overcrowding prevention)
        if h.available_beds > 0:
            h.available_beds -= 1
            await db.update_hospital(session, h.id, {"available_beds": h.available_beds})
        if victim.needs_icu and h.icu_available > 0:
            h.icu_available -= 1
            await db.update_hospital(session, h.id, {"icu_available": h.icu_available})

        result = AllocationResult(
            victim=victim,
            hospital=h,
            score=best.score,
            distance_km=best.distance_km,
            travel_time_min=best.travel_time_min,
            reasons=best.reasons,
            priority_rank=idx + 1,
        )
        await db.create_allocation_result(session, result)
        results.append(result)

    await session.commit()

    # Compute stats
    allocated = len(results)
    crit_alloc = sum(1 for r in results if r.victim.severity == Severity.CRITICAL)
    avg_score = sum(r.score for r in results) / allocated if allocated else 0
    avg_travel = sum(r.travel_time_min for r in results) / allocated if allocated else 0

    all_victims = await db.list_victims(session)
    unassigned_count = len([v for v in all_victims if v.assigned_hospital_id is None])

    return AllocationStats(
        total_victims=len(all_victims),
        allocated=allocated,
        critical_allocated=crit_alloc,
        avg_score=round(avg_score, 1),
        avg_travel_min=round(avg_travel, 1),
    )


@router.post("/{victim_id}", response_model=AllocationResult)
async def allocate_single(victim_id: str, session: AsyncSession = Depends(get_session)):
    """Allocate a single victim to the best hospital."""
    victim = await db.get_victim(session, victim_id)
    if not victim:
        raise HTTPException(status_code=404, detail="Victim not found")
    if victim.assigned_hospital_id:
        raise HTTPException(status_code=400, detail="Victim already assigned")

    hospitals = await db.list_hospitals(session)
    best = await find_best_hospital(victim, hospitals)
    if best is None:
        raise HTTPException(status_code=500, detail="No hospitals available")

    h = best.hospital
    await db.update_victim(session, victim.id, {"assigned_hospital_id": h.id})

    if h.available_beds > 0:
        h.available_beds -= 1
        await db.update_hospital(session, h.id, {"available_beds": h.available_beds})
    if victim.needs_icu and h.icu_available > 0:
        h.icu_available -= 1
        await db.update_hospital(session, h.id, {"icu_available": h.icu_available})

    result = AllocationResult(
        victim=victim,
        hospital=h,
        score=best.score,
        distance_km=best.distance_km,
        travel_time_min=best.travel_time_min,
        reasons=best.reasons,
        priority_rank=1,
    )
    await db.create_allocation_result(session, result)
    await session.commit()
    return result
