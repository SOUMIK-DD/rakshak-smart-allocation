import axios from "axios";
import type {
  Hospital,
  Victim,
  AllocationResult,
  AllocationStats,
  DashboardStats,
  Building,
  BuildingDetail,
  Drill,
  DrillStatus,
  DrillReport,
  ActionRecord,
  AuthResponse,
  User,
} from "./types";

const client = axios.create({ baseURL: "/api" });

// Request interceptor — attach JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — redirect on 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post("/auth/login", { username, password });
  return data;
}

export async function registerUser(username: string, password: string, role: string = "operator"): Promise<AuthResponse> {
  const { data } = await client.post("/auth/register", { username, password, role });
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await client.get("/auth/me");
  return data;
}

// --- Seed ---
export async function seedData(): Promise<{
  hospitals: number;
  victims: number;
}> {
  const { data } = await client.post("/seed");
  return data;
}

// --- Stats ---
export async function getStats(): Promise<DashboardStats> {
  const { data } = await client.get("/stats");
  return data;
}

// --- Hospitals ---
export async function getHospitals(): Promise<Hospital[]> {
  const { data } = await client.get("/hospitals");
  return data;
}

export async function createHospital(hospital: Omit<Hospital, "id">): Promise<Hospital> {
  const { data } = await client.post("/hospitals", hospital);
  return data;
}

export async function updateHospital(id: string, hospital: Omit<Hospital, "id">): Promise<Hospital> {
  const { data } = await client.put(`/hospitals/${id}`, hospital);
  return data;
}

export async function deleteHospital(id: string): Promise<void> {
  await client.delete(`/hospitals/${id}`);
}

// --- Victims ---
export async function getVictims(): Promise<Victim[]> {
  const { data } = await client.get("/victims");
  return data;
}

export async function getUnassignedVictims(): Promise<Victim[]> {
  const { data } = await client.get("/victims/unassigned");
  return data;
}

export async function createVictim(victim: Omit<Victim, "id" | "assigned_hospital_id" | "created_at">): Promise<Victim> {
  const { data } = await client.post("/victims", victim);
  return data;
}

export async function updateVictim(id: string, victim: Omit<Victim, "id" | "assigned_hospital_id" | "created_at">): Promise<Victim> {
  const { data } = await client.put(`/victims/${id}`, victim);
  return data;
}

export async function deleteVictim(id: string): Promise<void> {
  await client.delete(`/victims/${id}`);
}

// --- Allocation ---
export async function allocateAll(): Promise<AllocationStats> {
  const { data } = await client.post("/allocate");
  return data;
}

export async function allocateSingle(
  victimId: string
): Promise<AllocationResult> {
  const { data } = await client.post(`/allocate/${victimId}`);
  return data;
}

// --- Results ---
export async function getResults(): Promise<AllocationResult[]> {
  const { data } = await client.get("/results");
  return data;
}

// --- Buildings ---
export async function getBuildings(): Promise<Building[]> {
  const { data } = await client.get("/buildings");
  return data;
}

export async function getBuildingDetail(id: string): Promise<BuildingDetail> {
  const { data } = await client.get(`/buildings/${id}`);
  return data;
}

export async function createBuilding(building: Omit<Building, "id">): Promise<Building> {
  const { data } = await client.post("/buildings", building);
  return data;
}

export async function deleteBuilding(id: string): Promise<void> {
  await client.delete(`/buildings/${id}`);
}

// --- Drills ---
export async function getDrills(): Promise<Drill[]> {
  const { data } = await client.get("/drills");
  return data;
}

export async function getDrill(id: string): Promise<Drill> {
  const { data } = await client.get(`/drills/${id}`);
  return data;
}

export async function createDrill(drill: Omit<Drill, "id" | "status" | "started_at" | "completed_at" | "total_participants" | "evacuated_count" | "evacuation_time_seconds">): Promise<Drill> {
  const { data } = await client.post("/drills", drill);
  return data;
}

export async function startDrill(id: string): Promise<DrillStatus> {
  const { data } = await client.post(`/drills/${id}/start`);
  return data;
}

export async function tickDrill(id: string): Promise<DrillStatus> {
  const { data } = await client.post(`/drills/${id}/tick`);
  return data;
}

export async function getDrillStatus(id: string): Promise<DrillStatus> {
  const { data } = await client.get(`/drills/${id}/status`);
  return data;
}

export async function getDrillReport(id: string): Promise<DrillReport> {
  const { data } = await client.get(`/drills/${id}/report`);
  return data;
}

// --- History (Undo/Redo) ---
export async function getHistory(): Promise<ActionRecord[]> {
  const { data } = await client.get("/history");
  return data;
}

export async function undo(): Promise<{ success: boolean; message: string }> {
  const { data } = await client.post("/history/undo");
  return data;
}

export async function redo(): Promise<{ success: boolean; message: string }> {
  const { data } = await client.post("/history/redo");
  return data;
}
