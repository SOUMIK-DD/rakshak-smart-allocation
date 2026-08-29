"""SQLAlchemy-backed database operations for the disaster management system."""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from db_models import (
    HospitalRow,
    VictimRow,
    AllocationResultRow,
    ActionHistoryRow,
    BuildingRow,
    FloorRow,
    RoomRow,
    DrillRow,
    DrillParticipantRow,
    UserRow,
)
from models import (
    Hospital,
    Victim,
    AllocationResult,
    Severity,
    StaffLevel,
    Building,
    Floor,
    Room,
    Drill,
)


# ---------------------------------------------------------------------------
# User CRUD (Authentication)
# ---------------------------------------------------------------------------

async def create_user(session: AsyncSession, user_id: str, username: str, hashed_password: str, role: str = "operator") -> None:
    row = UserRow(
        id=user_id,
        username=username,
        hashed_password=hashed_password,
        role=role,
    )
    session.add(row)
    await session.flush()


async def get_user_by_username(session: AsyncSession, username: str) -> Optional[dict]:
    result = await session.execute(select(UserRow).where(UserRow.username == username))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return {
        "id": row.id,
        "username": row.username,
        "hashed_password": row.hashed_password,
        "role": row.role,
    }


# ---------------------------------------------------------------------------
# Hospital CRUD
# ---------------------------------------------------------------------------

async def create_hospital(session: AsyncSession, h: Hospital) -> Hospital:
    row = HospitalRow(
        id=h.id,
        name=h.name,
        lat=h.lat,
        lon=h.lon,
        total_beds=h.total_beds,
        available_beds=h.available_beds,
        icu_beds=h.icu_beds,
        icu_available=h.icu_available,
        facilities=h.facilities,
        staff_level=h.staff_level.value,
    )
    session.add(row)
    await session.flush()
    return h


async def get_hospital(session: AsyncSession, hid: str) -> Optional[Hospital]:
    result = await session.execute(select(HospitalRow).where(HospitalRow.id == hid))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return _row_to_hospital(row)


async def list_hospitals(session: AsyncSession) -> list[Hospital]:
    result = await session.execute(select(HospitalRow))
    return [_row_to_hospital(r) for r in result.scalars().all()]


async def update_hospital(session: AsyncSession, hid: str, data: dict) -> Optional[Hospital]:
    await session.execute(update(HospitalRow).where(HospitalRow.id == hid).values(**data))
    await session.flush()
    return await get_hospital(session, hid)


async def delete_hospital(session: AsyncSession, hid: str) -> bool:
    result = await session.execute(delete(HospitalRow).where(HospitalRow.id == hid))
    await session.flush()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Victim CRUD
# ---------------------------------------------------------------------------

async def create_victim(session: AsyncSession, v: Victim) -> Victim:
    row = VictimRow(
        id=v.id,
        name=v.name,
        lat=v.lat,
        lon=v.lon,
        severity=v.severity.value,
        conditions=v.conditions,
        age=v.age,
        needs_icu=v.needs_icu,
        assigned_hospital_id=v.assigned_hospital_id,
    )
    session.add(row)
    await session.flush()
    return v


async def get_victim(session: AsyncSession, vid: str) -> Optional[Victim]:
    result = await session.execute(select(VictimRow).where(VictimRow.id == vid))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return _row_to_victim(row)


async def list_victims(session: AsyncSession) -> list[Victim]:
    result = await session.execute(select(VictimRow))
    return [_row_to_victim(r) for r in result.scalars().all()]


async def list_unassigned_victims(session: AsyncSession) -> list[Victim]:
    result = await session.execute(
        select(VictimRow).where(VictimRow.assigned_hospital_id.is_(None))
    )
    return [_row_to_victim(r) for r in result.scalars().all()]


async def update_victim(session: AsyncSession, vid: str, data: dict) -> Optional[Victim]:
    await session.execute(update(VictimRow).where(VictimRow.id == vid).values(**data))
    await session.flush()
    return await get_victim(session, vid)


async def delete_victim(session: AsyncSession, vid: str) -> bool:
    result = await session.execute(delete(VictimRow).where(VictimRow.id == vid))
    await session.flush()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Allocation Results
# ---------------------------------------------------------------------------

async def create_allocation_result(session: AsyncSession, r: AllocationResult) -> AllocationResult:
    row = AllocationResultRow(
        id=str(uuid.uuid4()),
        victim_id=r.victim.id,
        hospital_id=r.hospital.id,
        score=r.score,
        distance_km=r.distance_km,
        travel_time_min=r.travel_time_min,
        reasons=r.reasons,
        priority_rank=r.priority_rank,
    )
    session.add(row)
    await session.flush()
    return r


async def list_allocation_results(session: AsyncSession) -> list[dict]:
    result = await session.execute(select(AllocationResultRow))
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "victim_id": r.victim_id,
            "hospital_id": r.hospital_id,
            "score": r.score,
            "distance_km": r.distance_km,
            "travel_time_min": r.travel_time_min,
            "reasons": r.reasons,
            "priority_rank": r.priority_rank,
        }
        for r in rows
    ]


async def clear_allocation_results(session: AsyncSession) -> None:
    await session.execute(delete(AllocationResultRow))


# ---------------------------------------------------------------------------
# Action History (Undo/Redo)
# ---------------------------------------------------------------------------

async def record_action(
    session: AsyncSession,
    action_type: str,
    entity_type: str,
    entity_id: str | None,
    before_state: dict | None,
    after_state: dict | None,
) -> str:
    action_id = str(uuid.uuid4())
    row = ActionHistoryRow(
        id=action_id,
        action_type=action_type,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state_json=before_state,
        after_state_json=after_state,
    )
    session.add(row)
    await session.flush()
    return action_id


async def get_last_action(session: AsyncSession) -> Optional[ActionHistoryRow]:
    result = await session.execute(
        select(ActionHistoryRow)
        .where(ActionHistoryRow.undone_at.is_(None))
        .order_by(ActionHistoryRow.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def undo_action(session: AsyncSession, action_id: str) -> Optional[ActionHistoryRow]:
    await session.execute(
        update(ActionHistoryRow)
        .where(ActionHistoryRow.id == action_id)
        .values(undone_at=datetime.utcnow())
    )
    await session.flush()
    result = await session.execute(select(ActionHistoryRow).where(ActionHistoryRow.id == action_id))
    return result.scalar_one_or_none()


async def redo_action(session: AsyncSession, action_id: str) -> Optional[ActionHistoryRow]:
    await session.execute(
        update(ActionHistoryRow)
        .where(ActionHistoryRow.id == action_id)
        .values(undone_at=None)
    )
    await session.flush()
    result = await session.execute(select(ActionHistoryRow).where(ActionHistoryRow.id == action_id))
    return result.scalar_one_or_none()


async def list_history(session: AsyncSession, limit: int = 50) -> list[ActionHistoryRow]:
    result = await session.execute(
        select(ActionHistoryRow).order_by(ActionHistoryRow.created_at.desc()).limit(limit)
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Building CRUD
# ---------------------------------------------------------------------------

async def create_building(session: AsyncSession, b: Building) -> Building:
    row = BuildingRow(
        id=b.id,
        name=b.name,
        address=b.address,
        lat=b.lat,
        lon=b.lon,
        num_floors=b.num_floors,
    )
    session.add(row)
    await session.flush()
    return b


async def get_building(session: AsyncSession, bid: str) -> Optional[Building]:
    result = await session.execute(select(BuildingRow).where(BuildingRow.id == bid))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return _row_to_building(row)


async def list_buildings(session: AsyncSession) -> list[Building]:
    result = await session.execute(select(BuildingRow))
    return [_row_to_building(r) for r in result.scalars().all()]


async def delete_building(session: AsyncSession, bid: str) -> bool:
    result = await session.execute(delete(BuildingRow).where(BuildingRow.id == bid))
    await session.flush()
    return result.rowcount > 0


# ---------------------------------------------------------------------------
# Floor CRUD
# ---------------------------------------------------------------------------

async def create_floor(session: AsyncSession, f: Floor) -> Floor:
    row = FloorRow(
        id=f.id,
        building_id=f.building_id,
        floor_number=f.floor_number,
        layout_json=f.layout_json,
    )
    session.add(row)
    await session.flush()
    return f


async def get_floors_for_building(session: AsyncSession, building_id: str) -> list[Floor]:
    result = await session.execute(
        select(FloorRow).where(FloorRow.building_id == building_id).order_by(FloorRow.floor_number)
    )
    return [_row_to_floor(r) for r in result.scalars().all()]


# ---------------------------------------------------------------------------
# Room CRUD
# ---------------------------------------------------------------------------

async def create_room(session: AsyncSession, r: Room) -> Room:
    row = RoomRow(
        id=r.id,
        floor_id=r.floor_id,
        name=r.name,
        room_type=r.room_type,
        x=r.x,
        y=r.y,
        width=r.width,
        height=r.height,
        is_exit=r.is_exit,
        is_stairwell=r.is_stairwell,
        is_hazard=r.is_hazard,
        occupancy=r.occupancy,
    )
    session.add(row)
    await session.flush()
    return r


async def get_rooms_for_floor(session: AsyncSession, floor_id: str) -> list[Room]:
    result = await session.execute(
        select(RoomRow).where(RoomRow.floor_id == floor_id)
    )
    return [_row_to_room(r) for r in result.scalars().all()]


async def update_room(session: AsyncSession, rid: str, data: dict) -> None:
    await session.execute(update(RoomRow).where(RoomRow.id == rid).values(**data))
    await session.flush()


# ---------------------------------------------------------------------------
# Drill CRUD
# ---------------------------------------------------------------------------

async def create_drill(session: AsyncSession, d: Drill, total_participants: int = 0) -> Drill:
    row = DrillRow(
        id=d.id,
        building_id=d.building_id,
        scenario_type=d.scenario_type,
        hazard_floor=d.hazard_floor,
        hazard_room=d.hazard_room,
        status=d.status,
        total_participants=total_participants,
    )
    session.add(row)
    await session.flush()
    return d


async def get_drill(session: AsyncSession, did: str) -> Optional[Drill]:
    result = await session.execute(select(DrillRow).where(DrillRow.id == did))
    row = result.scalar_one_or_none()
    if not row:
        return None
    return _row_to_drill(row)


async def list_drills(session: AsyncSession) -> list[Drill]:
    result = await session.execute(select(DrillRow).order_by(DrillRow.created_at.desc()))
    return [_row_to_drill(r) for r in result.scalars().all()]


async def update_drill(session: AsyncSession, did: str, data: dict) -> None:
    result = await session.execute(select(DrillRow).where(DrillRow.id == did))
    row = result.scalar_one_or_none()
    if row:
        for key, value in data.items():
            setattr(row, key, value)
        await session.flush()


# ---------------------------------------------------------------------------
# Drill Participants
# ---------------------------------------------------------------------------

async def create_drill_participant(session: AsyncSession, p: dict) -> None:
    row = DrillParticipantRow(**p)
    session.add(row)
    await session.flush()


async def get_drill_participants(session: AsyncSession, drill_id: str) -> list[DrillParticipantRow]:
    result = await session.execute(
        select(DrillParticipantRow).where(DrillParticipantRow.drill_id == drill_id)
    )
    return list(result.scalars().all())


async def update_drill_participant(session: AsyncSession, pid: str, data: dict) -> None:
    await session.execute(update(DrillParticipantRow).where(DrillParticipantRow.id == pid).values(**data))
    await session.flush()


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

async def seed_demo_data(session: AsyncSession) -> dict:
    """Create demo hospitals and victims if the database is empty."""
    existing = await list_hospitals(session)
    if existing:
        return {"message": "Data already seeded", "hospitals": len(existing)}

    from mock_data import generate_hospitals, generate_victims

    hospitals = generate_hospitals()
    victims = generate_victims()

    for h in hospitals:
        await create_hospital(session, h)
    for v in victims:
        await create_victim(session, v)

    return {"message": "Demo data seeded", "hospitals": len(hospitals), "victims": len(victims)}


# ---------------------------------------------------------------------------
# Row → Model converters
# ---------------------------------------------------------------------------

def _row_to_hospital(row: HospitalRow) -> Hospital:
    return Hospital(
        id=row.id,
        name=row.name,
        lat=row.lat,
        lon=row.lon,
        total_beds=row.total_beds,
        available_beds=row.available_beds,
        icu_beds=row.icu_beds,
        icu_available=row.icu_available,
        facilities=row.facilities or [],
        staff_level=StaffLevel(row.staff_level),
    )


def _row_to_victim(row: VictimRow) -> Victim:
    return Victim(
        id=row.id,
        name=row.name,
        lat=row.lat,
        lon=row.lon,
        severity=Severity(row.severity),
        conditions=row.conditions or [],
        age=row.age,
        needs_icu=row.needs_icu,
        assigned_hospital_id=row.assigned_hospital_id,
        created_at=row.created_at or datetime.utcnow(),
    )


def _row_to_building(row: BuildingRow) -> Building:
    return Building(
        id=row.id,
        name=row.name,
        address=row.address,
        lat=row.lat,
        lon=row.lon,
        num_floors=row.num_floors,
    )


def _row_to_floor(row: FloorRow) -> Floor:
    return Floor(
        id=row.id,
        building_id=row.building_id,
        floor_number=row.floor_number,
        layout_json=row.layout_json or {},
    )


def _row_to_room(row: RoomRow) -> Room:
    return Room(
        id=row.id,
        floor_id=row.floor_id,
        name=row.name,
        room_type=row.room_type,
        x=row.x,
        y=row.y,
        width=row.width,
        height=row.height,
        is_exit=row.is_exit,
        is_stairwell=row.is_stairwell,
        is_hazard=row.is_hazard,
        occupancy=row.occupancy,
    )


def _row_to_drill(row: DrillRow) -> Drill:
    return Drill(
        id=row.id,
        building_id=row.building_id,
        scenario_type=row.scenario_type,
        hazard_floor=row.hazard_floor,
        hazard_room=row.hazard_room,
        status=row.status,
        started_at=row.started_at,
        completed_at=row.completed_at,
        total_participants=row.total_participants,
        evacuated_count=row.evacuated_count,
        evacuation_time_seconds=row.evacuation_time_seconds,
    )
