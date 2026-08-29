export type Severity = "CRITICAL" | "SEVERE" | "MODERATE" | "MILD";
export type StaffLevel = "LOW" | "MODERATE" | "FULL";
export type UserRole = "admin" | "operator" | "viewer";

// Authentication
export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Hospital {
  id: string;
  name: string;
  lat: number;
  lon: number;
  total_beds: number;
  available_beds: number;
  icu_beds: number;
  icu_available: number;
  facilities: string[];
  staff_level: StaffLevel;
}

export interface Victim {
  id: string;
  name: string;
  lat: number;
  lon: number;
  severity: Severity;
  conditions: string[];
  age: number;
  needs_icu: boolean;
  assigned_hospital_id: string | null;
  created_at: string;
}

export interface AllocationResult {
  victim: Victim;
  hospital: Hospital;
  score: number;
  distance_km: number;
  travel_time_min: number;
  reasons: string[];
  priority_rank: number;
}

export interface AllocationStats {
  total_victims: number;
  allocated: number;
  critical_allocated: number;
  avg_score: number;
  avg_travel_min: number;
}

export interface DashboardStats {
  total_hospitals: number;
  total_beds: number;
  available_beds: number;
  total_icu: number;
  icu_available: number;
  total_victims: number;
  unassigned_victims: number;
  assigned_victims: number;
  utilization_pct: number;
  icu_utilization_pct: number;
}

// Indoor Emergency Model
export interface Building {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  num_floors: number;
}

export interface Floor {
  id: string;
  building_id: string;
  floor_number: number;
  layout_json: Record<string, any>;
}

export interface Room {
  id: string;
  floor_id: string;
  name: string;
  room_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  is_exit: boolean;
  is_stairwell: boolean;
  is_hazard: boolean;
  occupancy: number;
}

export interface BuildingDetail {
  building: Building;
  floors: Floor[];
  rooms_by_floor: Record<number, Room[]>;
}

// Evacuation Drills
export interface Drill {
  id: string;
  building_id: string;
  scenario_type: string;
  hazard_floor: number;
  hazard_room: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  total_participants: number;
  evacuated_count: number;
  evacuation_time_seconds: number;
}

export interface DrillStatus {
  drill: Drill;
  participants_evacuated: number;
  participants_remaining: number;
  elapsed_seconds: number;
  current_phase: string;
}

export interface DrillReport {
  drill: Drill;
  total_time_seconds: number;
  avg_evacuation_time: number;
  floor_times: Record<number, number>;
  bottlenecks: string[];
  recommendations: string[];
  success_rate: number;
}

// Undo/Redo
export interface ActionRecord {
  id: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  before_state: Record<string, any> | null;
  after_state: Record<string, any> | null;
  created_at: string;
  undone_at: string | null;
}
