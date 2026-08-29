"""Undo/Redo history endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db_session import get_session
from db_models import ActionHistoryRow
from models import ActionRecord, UndoRedoResponse
import database as db

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("", response_model=list[ActionRecord])
async def list_history(session: AsyncSession = Depends(get_session)):
    """Get the action history."""
    rows = await db.list_history(session)
    return [
        ActionRecord(
            id=r.id,
            action_type=r.action_type,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            before_state=r.before_state_json,
            after_state=r.after_state_json,
            created_at=r.created_at,
            undone_at=r.undone_at,
        )
        for r in rows
    ]


@router.post("/undo", response_model=UndoRedoResponse)
async def undo(session: AsyncSession = Depends(get_session)):
    """Undo the last action."""
    last_action = await db.get_last_action(session)
    if not last_action:
        return UndoRedoResponse(success=False, message="Nothing to undo")

    await db.record_action(session, "undo", last_action.entity_type, last_action.entity_id, None, None)

    if last_action.before_state_json and last_action.entity_type == "hospital":
        await db.update_hospital(session, last_action.entity_id, last_action.before_state_json)
    elif last_action.before_state_json and last_action.entity_type == "victim":
        await db.update_victim(session, last_action.entity_id, last_action.before_state_json)
    elif last_action.action_type == "delete" and last_action.before_state_json:
        if last_action.entity_type == "hospital":
            from models import Hospital
            h = Hospital(**last_action.before_state_json)
            await db.create_hospital(session, h)
        elif last_action.entity_type == "victim":
            from models import Victim
            v = Victim(**last_action.before_state_json)
            await db.create_victim(session, v)

    await db.undo_action(session, last_action.id)
    await session.commit()

    return UndoRedoResponse(
        success=True,
        action=ActionRecord(
            id=last_action.id,
            action_type=last_action.action_type,
            entity_type=last_action.entity_type,
            entity_id=last_action.entity_id,
            before_state=last_action.before_state_json,
            after_state=last_action.after_state_json,
            created_at=last_action.created_at,
            undone_at=last_action.undone_at,
        ),
        message=f"Undid {last_action.action_type} on {last_action.entity_type}",
    )


@router.post("/redo", response_model=UndoRedoResponse)
async def redo(session: AsyncSession = Depends(get_session)):
    """Redo the last undone action."""
    result = await session.execute(
        select(ActionHistoryRow)
        .where(ActionHistoryRow.undone_at.isnot(None))
        .order_by(ActionHistoryRow.undone_at.desc())
        .limit(1)
    )
    action = result.scalar_one_or_none()

    if not action:
        return UndoRedoResponse(success=False, message="Nothing to redo")

    if action.after_state_json and action.entity_type == "hospital":
        await db.update_hospital(session, action.entity_id, action.after_state_json)
    elif action.after_state_json and action.entity_type == "victim":
        await db.update_victim(session, action.entity_id, action.after_state_json)
    elif action.action_type == "delete":
        if action.entity_type == "hospital":
            await db.delete_hospital(session, action.entity_id)
        elif action.entity_type == "victim":
            await db.delete_victim(session, action.entity_id)

    await db.redo_action(session, action.id)
    await session.commit()

    return UndoRedoResponse(
        success=True,
        action=ActionRecord(
            id=action.id,
            action_type=action.action_type,
            entity_type=action.entity_type,
            entity_id=action.entity_id,
            before_state=action.before_state_json,
            after_state=action.after_state_json,
            created_at=action.created_at,
            undone_at=action.undone_at,
        ),
        message=f"Redid {action.action_type} on {action.entity_type}",
    )
