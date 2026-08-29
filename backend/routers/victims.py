"""Victim CRUD endpoints with full CRUD operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import get_session
from models import Victim, VictimCreate
import database as db

router = APIRouter(prefix="/api/victims", tags=["victims"])


@router.get("", response_model=list[Victim])
async def list_victims(session: AsyncSession = Depends(get_session)):
    return await db.list_victims(session)


@router.get("/unassigned", response_model=list[Victim])
async def list_unassigned(session: AsyncSession = Depends(get_session)):
    return await db.list_unassigned_victims(session)


@router.get("/{victim_id}", response_model=Victim)
async def get_victim(victim_id: str, session: AsyncSession = Depends(get_session)):
    v = await db.get_victim(session, victim_id)
    if not v:
        raise HTTPException(status_code=404, detail="Victim not found")
    return v


@router.post("", response_model=Victim, status_code=201)
async def create_victim(payload: VictimCreate, session: AsyncSession = Depends(get_session)):
    v = Victim(**payload.model_dump())
    result = await db.create_victim(session, v)
    await session.commit()
    return result


@router.put("/{victim_id}", response_model=Victim)
async def update_victim(
    victim_id: str,
    payload: VictimCreate,
    session: AsyncSession = Depends(get_session),
):
    existing = await db.get_victim(session, victim_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Victim not found")

    before_state = existing.model_dump()
    data = payload.model_dump()
    await db.record_action(session, "update", "victim", victim_id, before_state, data)

    updated = await db.update_victim(session, victim_id, data)
    await session.commit()
    return updated


@router.delete("/{victim_id}")
async def delete_victim(victim_id: str, session: AsyncSession = Depends(get_session)):
    existing = await db.get_victim(session, victim_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Victim not found")

    before_state = existing.model_dump()
    await db.record_action(session, "delete", "victim", victim_id, before_state, None)

    success = await db.delete_victim(session, victim_id)
    await session.commit()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete victim")
    return {"message": "Victim deleted", "id": victim_id}
