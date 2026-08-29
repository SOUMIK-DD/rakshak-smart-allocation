"""SQLAlchemy table definitions for the disaster management system."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    JSON,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Users (Authentication)
# ---------------------------------------------------------------------------

class UserRow(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(200), nullable=False)
    role = Column(String(20), default="operator")  # admin, operator, viewer
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Core tables
# ---------------------------------------------------------------------------

class HospitalRow(Base):
    __tablename__ = "hospitals"

    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    total_beds = Column(Integer, default=0)
    available_beds = Column(Integer, default=0)
    icu_beds = Column(Integer, default=0)
    icu_available = Column(Integer, default=0)
    facilities = Column(JSON, default=list)
    staff_level = Column(String(20), default="MODERATE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class VictimRow(Base):
    __tablename__ = "victims"

    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    severity = Column(String(20), default="MODERATE")
    conditions = Column(JSON, default=list)
    age = Column(Integer, default=0)
    needs_icu = Column(Boolean, default=False)
    assigned_hospital_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AllocationResultRow(Base):
    __tablename__ = "allocation_results"

    id = Column(String(36), primary_key=True)
    victim_id = Column(String(36), ForeignKey("victims.id"), nullable=False)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=False)
    score = Column(Float, default=0.0)
    distance_km = Column(Float, default=0.0)
    travel_time_min = Column(Float, default=0.0)
    reasons = Column(JSON, default=list)
    priority_rank = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Indoor emergency model
# ---------------------------------------------------------------------------

class BuildingRow(Base):
    __tablename__ = "buildings"

    id = Column(String(36), primary_key=True)
    name = Column(String(200), nullable=False)
    address = Column(String(500), default="")
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    num_floors = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


class FloorRow(Base):
    __tablename__ = "floors"

    id = Column(String(36), primary_key=True)
    building_id = Column(String(36), ForeignKey("buildings.id"), nullable=False)
    floor_number = Column(Integer, nullable=False)
    layout_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class RoomRow(Base):
    __tablename__ = "rooms"

    id = Column(String(36), primary_key=True)
    floor_id = Column(String(36), ForeignKey("floors.id"), nullable=False)
    name = Column(String(100), nullable=False)
    room_type = Column(String(50), default="room")
    x = Column(Integer, default=0)
    y = Column(Integer, default=0)
    width = Column(Integer, default=1)
    height = Column(Integer, default=1)
    is_exit = Column(Boolean, default=False)
    is_stairwell = Column(Boolean, default=False)
    is_hazard = Column(Boolean, default=False)
    occupancy = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Evacuation drills
# ---------------------------------------------------------------------------

class DrillRow(Base):
    __tablename__ = "drills"

    id = Column(String(36), primary_key=True)
    building_id = Column(String(36), ForeignKey("buildings.id"), nullable=False)
    scenario_type = Column(String(50), default="fire")
    hazard_floor = Column(Integer, default=1)
    hazard_room = Column(String(100), default="")
    status = Column(String(20), default="pending")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    total_participants = Column(Integer, default=0)
    evacuated_count = Column(Integer, default=0)
    evacuation_time_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class DrillParticipantRow(Base):
    __tablename__ = "drill_participants"

    id = Column(String(36), primary_key=True)
    drill_id = Column(String(36), ForeignKey("drills.id"), nullable=False)
    room_id = Column(String(36), ForeignKey("rooms.id"), nullable=False)
    person_name = Column(String(200), default="")
    evacuated = Column(Boolean, default=False)
    evacuation_time = Column(Float, default=0.0)
    path_taken = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Undo/Redo history
# ---------------------------------------------------------------------------

class ActionHistoryRow(Base):
    __tablename__ = "action_history"

    id = Column(String(36), primary_key=True)
    action_type = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    before_state_json = Column(JSON, nullable=True)
    after_state_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    undone_at = Column(DateTime, nullable=True)
