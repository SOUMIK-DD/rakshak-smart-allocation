"""Pydantic models for the Smart Hospital Allocation system."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    SEVERE = "SEVERE"
    MODERATE = "MODERATE"
    MILD = "MILD"


class StaffLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    FULL = "FULL"


# ---------------------------------------------------------------------------
# Hospital
# ---------------------------------------------------------------------------

class HospitalBase(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    total_beds: int = Field(..., ge=0)
    available_beds: int = Field(..., ge=0)
    icu_beds: int = Field(..., ge=0)
    icu_available: int = Field(..., ge=0)
    facilities: list[str] = Field(default_factory=list)
    staff_level: StaffLevel = StaffLevel.MODERATE


class HospitalCreate(HospitalBase):
    pass


class Hospital(HospitalBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    def capacity_pct(self) -> float:
        return self.available_beds / self.total_beds if self.total_beds else 0.0

    def icu_pct(self) -> float:
        return self.icu_available / self.icu_beds if self.icu_beds else 0.0


# ---------------------------------------------------------------------------
# Victim / Patient
# ---------------------------------------------------------------------------

class VictimBase(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    severity: Severity = Severity.MODERATE
    conditions: list[str] = Field(default_factory=list)
    age: int = Field(..., ge=0, le=150)
    needs_icu: bool = False


class VictimCreate(VictimBase):
    pass


class Victim(VictimBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assigned_hospital_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Allocation Result
# ---------------------------------------------------------------------------

class AllocationCandidate(BaseModel):
    hospital: Hospital
    score: float
    distance_km: float
    travel_time_min: float
    reasons: list[str] = Field(default_factory=list)


class AllocationResult(BaseModel):
    victim: Victim
    hospital: Hospital
    score: float
    distance_km: float
    travel_time_min: float
    reasons: list[str] = Field(default_factory=list)
    priority_rank: int = 1


class AllocationResponse(BaseModel):
    """Returned by POST /api/allocate — a batch of assignments."""
    results: list[AllocationResult]
    stats: AllocationStats | None = None


class AllocationStats(BaseModel):
    total_victims: int
    allocated: int
    critical_allocated: int
    avg_score: float
    avg_travel_min: float


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------

class DashboardStats(BaseModel):
    total_hospitals: int
    total_beds: int
    available_beds: int
    total_icu: int
    icu_available: int
    total_victims: int
    unassigned_victims: int
    assigned_victims: int
    utilization_pct: float
    icu_utilization_pct: float


# ---------------------------------------------------------------------------
# Indoor Emergency Model
# ---------------------------------------------------------------------------

class BuildingBase(BaseModel):
    name: str
    address: str = ""
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    num_floors: int = Field(default=1, ge=1, le=100)


class BuildingCreate(BuildingBase):
    pass


class Building(BuildingBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class FloorBase(BaseModel):
    building_id: str
    floor_number: int
    layout_json: dict = Field(default_factory=dict)


class FloorCreate(FloorBase):
    pass


class Floor(FloorBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class RoomBase(BaseModel):
    floor_id: str
    name: str
    room_type: str = "room"
    x: int = 0
    y: int = 0
    width: int = 1
    height: int = 1
    is_exit: bool = False
    is_stairwell: bool = False
    is_hazard: bool = False
    occupancy: int = 0


class RoomCreate(RoomBase):
    pass


class Room(RoomBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))


class BuildingDetail(BaseModel):
    building: Building
    floors: list[Floor]
    rooms_by_floor: dict[int, list[Room]]


# ---------------------------------------------------------------------------
# Evacuation Drill
# ---------------------------------------------------------------------------

class DrillBase(BaseModel):
    building_id: str
    scenario_type: str = "fire"
    hazard_floor: int = 1
    hazard_room: str = ""


class DrillCreate(DrillBase):
    pass


class Drill(DrillBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"
    started_at: datetime | None = None
    completed_at: datetime | None = None
    total_participants: int = 0
    evacuated_count: int = 0
    evacuation_time_seconds: float = 0.0


class DrillStatus(BaseModel):
    drill: Drill
    participants_evacuated: int
    participants_remaining: int
    elapsed_seconds: float
    current_phase: str


class DrillReport(BaseModel):
    drill: Drill
    total_time_seconds: float
    avg_evacuation_time: float
    floor_times: dict[int, float]
    bottlenecks: list[str]
    recommendations: list[str]
    success_rate: float


# ---------------------------------------------------------------------------
# Undo/Redo
# ---------------------------------------------------------------------------

class ActionRecord(BaseModel):
    id: str
    action_type: str
    entity_type: str
    entity_id: str | None = None
    before_state: dict | None = None
    after_state: dict | None = None
    created_at: datetime
    undone_at: datetime | None = None


class UndoRedoResponse(BaseModel):
    success: bool
    action: ActionRecord | None = None
    message: str = ""
