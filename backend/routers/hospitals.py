"""Hospital CRUD endpoints with full CRUD operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from db_session import get_session
from models import Hospital, HospitalCreate
import database as db

router = APIRouter(prefix="/api/hospitals", tags=["hospitals"])


@router.get("", response_model=list[Hospital])
async def list_hospitals(session: AsyncSession = Depends(get_session)):
    return await db.list_hospitals(session)


@router.get("/{hospital_id}", response_model=Hospital)
async def get_hospital(hospital_id: str, session: AsyncSession = Depends(get_session)):
    h = await db.get_hospital(session, hospital_id)
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return h


@router.post("", response_model=Hospital, status_code=201)
async def create_hospital(payload: HospitalCreate, session: AsyncSession = Depends(get_session)):
    h = Hospital(**payload.model_dump())
    result = await db.create_hospital(session, h)
    await session.commit()
    return result


@router.put("/{hospital_id}", response_model=Hospital)
async def update_hospital(
    hospital_id: str,
    payload: HospitalCreate,
    session: AsyncSession = Depends(get_session),
):
    existing = await db.get_hospital(session, hospital_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Hospital not found")

    before_state = existing.model_dump()
    data = payload.model_dump()
    await db.record_action(session, "update", "hospital", hospital_id, before_state, data)

    updated = await db.update_hospital(session, hospital_id, data)
    await session.commit()
    return updated


@router.delete("/{hospital_id}")
async def delete_hospital(hospital_id: str, session: AsyncSession = Depends(get_session)):
    existing = await db.get_hospital(session, hospital_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Hospital not found")

    before_state = existing.model_dump()
    await db.record_action(session, "delete", "hospital", hospital_id, before_state, None)

    success = await db.delete_hospital(session, hospital_id)
    await session.commit()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete hospital")
    return {"message": "Hospital deleted", "id": hospital_id}
