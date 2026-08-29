"""Building CRUD and indoor emergency model endpoints."""

from __future__ import annotations

import random
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import get_session
from models import (
    Building,
    BuildingCreate,
    BuildingDetail,
    Floor,
    FloorCreate,
    Room,
    RoomCreate,
)
import database as db

router = APIRouter(prefix="/api/buildings", tags=["buildings"])


@router.get("", response_model=list[Building])
async def list_buildings(session: AsyncSession = Depends(get_session)):
    return await db.list_buildings(session)


@router.get("/{building_id}", response_model=BuildingDetail)
async def get_building_detail(building_id: str, session: AsyncSession = Depends(get_session)):
    building = await db.get_building(session, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    floors = await db.get_floors_for_building(session, building_id)
    rooms_by_floor: dict[int, list[Room]] = {}
    for floor in floors:
        rooms = await db.get_rooms_for_floor(session, floor.id)
        rooms_by_floor[floor.floor_number] = rooms

    return BuildingDetail(
        building=building,
        floors=floors,
        rooms_by_floor=rooms_by_floor,
    )


@router.post("", response_model=Building, status_code=201)
async def create_building(payload: BuildingCreate, session: AsyncSession = Depends(get_session)):
    b = Building(**payload.model_dump())
    created = await db.create_building(session, b)

    # Auto-generate floors and rooms
    for floor_num in range(1, b.num_floors + 1):
        floor = Floor(building_id=b.id, floor_number=floor_num)
        await db.create_floor(session, floor)

        # Generate rooms for each floor
        rooms_per_floor = random.randint(6, 10)
        exits_per_floor = random.randint(1, 2)
        stairwells_per_floor = 1

        for i in range(rooms_per_floor):
            is_exit = i < exits_per_floor
            is_stairwell = i == exits_per_floor and i < exits_per_floor + stairwells_per_floor
            is_hazard = False

            room = Room(
                floor_id=floor.id,
                name=f"Room {floor_num}-{i + 1}",
                room_type="exit" if is_exit else "stairwell" if is_stairwell else "room",
                x=i * 3,
                y=0,
                width=2,
                height=2,
                is_exit=is_exit,
                is_stairwell=is_stairwell,
                is_hazard=is_hazard,
                occupancy=random.randint(5, 30),
            )
            await db.create_room(session, room)

    await session.commit()
    return created


@router.delete("/{building_id}")
async def delete_building(building_id: str, session: AsyncSession = Depends(get_session)):
    existing = await db.get_building(session, building_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Building not found")

    success = await db.delete_building(session, building_id)
    await session.commit()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete building")
    return {"message": "Building deleted", "id": building_id}


@router.post("/{building_id}/generate-layout")
async def generate_building_layout(building_id: str, session: AsyncSession = Depends(get_session)):
    """Generate a random building layout with rooms, exits, and stairwells."""
    building = await db.get_building(session, building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")

    floors = await db.get_floors_for_building(session, building_id)

    for floor in floors:
        rooms_per_floor = random.randint(6, 10)
        exits_per_floor = random.randint(1, 2)
        stairwells_per_floor = 1

        for i in range(rooms_per_floor):
            is_exit = i < exits_per_floor
            is_stairwell = i == exits_per_floor and i < exits_per_floor + stairwells_per_floor

            room = Room(
                floor_id=floor.id,
                name=f"Room {floor.floor_number}-{i + 1}",
                room_type="exit" if is_exit else "stairwell" if is_stairwell else "room",
                x=i * 3,
                y=0,
                width=2,
                height=2,
                is_exit=is_exit,
                is_stairwell=is_stairwell,
                is_hazard=False,
                occupancy=random.randint(5, 30),
            )
            await db.create_room(session, room)

    await session.commit()
    return {"message": "Layout generated", "building_id": building_id}
