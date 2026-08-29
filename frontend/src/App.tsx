import React, { useEffect, useState, useCallback } from "react";
import type { Hospital, Victim, AllocationResult, DashboardStats, Building, Drill } from "./types";
import {
  seedData,
  getStats,
  getHospitals,
  getVictims,
  allocateAll,
  allocateSingle,
  getResults,
  getBuildings,
  getDrills,
} from "./api";
import { AuthProvider, useAuth } from "./components/AuthContext";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import VictimList from "./components/VictimList";
import AllocationMap from "./components/AllocationMap";
import ResultCard from "./components/ResultCard";
import ManageTab from "./components/ManageTab";
import BuildingsTab from "./components/BuildingsTab";
import DrillsTab from "./components/DrillsTab";
import UndoRedo from "./components/UndoRedo";

type Tab = "dashboard" | "victims" | "map" | "results" | "manage" | "buildings" | "drills";

const tabs: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "📊 Dashboard" },
  { key: "victims", label: "🚑 Victims" },
  { key: "map", label: "🗺️ Map" },
  { key: "results", label: "📋 Results" },
  { key: "manage", label: "⚙️ Manage" },
  { key: "buildings", label: "🏢 Buildings" },
  { key: "drills", label: "🚨 Drills" },
];

function AppContent() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [results, setResults] = useState<AllocationResult[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [s, h, v, r, b, d] = await Promise.all([
        getStats(),
        getHospitals(),
        getVictims(),
        getResults(),
        getBuildings(),
        getDrills(),
      ]);
      setStats(s);
      setHospitals(h);
      setVictims(v);
      setResults(r);
      setBuildings(b);
      setDrills(d);
    } catch (err) {
      console.error("Failed to refresh data:", err);
    }
  }, []);

  // Load existing data on mount (NO auto-seed!)
  useEffect(() => {
    if (isAuthenticated) {
      refresh();
    }
  }, [refresh, isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
        <div style={{ color: "#94a3b8", fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleAllocateAll = async () => {
    setLoading(true);
    try {
      await allocateAll();
      await refresh();
    } catch (err) {
      console.error("Allocation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateOne = async (victimId: string) => {
    setLoading(true);
    try {
      await allocateSingle(victimId);
      await refresh();
    } catch (err) {
      console.error("Single allocation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedData();
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleUndoRedo = async () => {
    await refresh();
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🏥</span>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>
              Rakshak — Disaster Management System
            </h1>
            <p style={{ fontSize: 12, color: "#64748b" }}>
              Odisha Emergency Response • Smart Hospital Allocation • Evacuation Drills
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            <span style={{ 
              padding: "2px 8px", 
              borderRadius: 4, 
              background: user?.role === "admin" ? "#166534" : user?.role === "operator" ? "#854d0e" : "#475569",
              color: "#e2e8f0",
              marginRight: 8,
            }}>
              {user?.role?.toUpperCase()}
            </span>
            {user?.username}
          </div>
          <UndoRedo onAction={handleUndoRedo} />
          {user?.role === "admin" && (
            <button
              onClick={handleSeed}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #475569",
                background: "#334155",
                color: "#e2e8f0",
                fontSize: 12,
                cursor: loading ? "default" : "pointer",
              }}
            >
              🔄 Reset Data
            </button>
          )}
          <button
            onClick={logout}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #475569",
              background: "#7f1d1d",
              color: "#fca5a5",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav
        style={{
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          padding: "0 24px",
          display: "flex",
          gap: 4,
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 18px",
              border: "none",
              borderBottom: tab === t.key ? "2px solid #3b82f6" : "2px solid transparent",
              background: "transparent",
              color: tab === t.key ? "#f8fafc" : "#94a3b8",
              fontWeight: tab === t.key ? 600 : 400,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {tab === "dashboard" && <Dashboard stats={stats} hospitals={hospitals} />}
        {tab === "victims" && (
          <VictimList
            victims={victims}
            onAllocateAll={handleAllocateAll}
            onAllocateOne={handleAllocateOne}
            loading={loading}
          />
        )}
        {tab === "map" && (
          <AllocationMap hospitals={hospitals} victims={victims} results={results} />
        )}
        {tab === "results" && <ResultCard results={results} />}
        {tab === "manage" && (
          <ManageTab
            hospitals={hospitals}
            victims={victims}
            onRefresh={refresh}
          />
        )}
        {tab === "buildings" && (
          <BuildingsTab buildings={buildings} onRefresh={refresh} />
        )}
        {tab === "drills" && (
          <DrillsTab drills={drills} buildings={buildings} onRefresh={refresh} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
