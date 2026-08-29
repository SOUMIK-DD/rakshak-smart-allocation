import React, { useState, useEffect, useRef } from "react";
import type { Building, Drill, DrillStatus, DrillReport } from "../types";
import { createDrill, startDrill, tickDrill, getDrillReport } from "../api";

interface Props {
  drills: Drill[];
  buildings: Building[];
  onRefresh: () => void;
}

export default function DrillsTab({ drills, buildings, onRefresh }: Props) {
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null);
  const [drillStatus, setDrillStatus] = useState<DrillStatus | null>(null);
  const [drillReport, setDrillReport] = useState<DrillReport | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Auto-refresh during simulation
  useEffect(() => {
    if (!simulating || !selectedDrill) return;

    const interval = setInterval(async () => {
      try {
        const status = await tickDrill(selectedDrill.id);
        setDrillStatus(status);

        if (status.current_phase === "completed") {
          setSimulating(false);
          // Fetch report
          const report = await getDrillReport(selectedDrill.id);
          setDrillReport(report);
          onRefresh();
        }
      } catch (err) {
        console.error("Drill tick failed:", err);
        setSimulating(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [simulating, selectedDrill]);

  const handleCreateDrill = async (data: any) => {
    setLoading(true);
    try {
      const drill = await createDrill(data);
      setSelectedDrill(drill);
      setShowForm(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to create drill:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartDrill = async (drillId: string) => {
    setLoading(true);
    try {
      const status = await startDrill(drillId);
      setDrillStatus(status);
      setSimulating(true);
    } catch (err) {
      console.error("Failed to start drill:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (drill: Drill) => {
    setSelectedDrill(drill);
    if (drill.status === "completed") {
      try {
        const report = await getDrillReport(drill.id);
        setDrillReport(report);
      } catch (err) {
        console.error("Failed to load report:", err);
      }
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>🚨 Evacuation Drills</h2>

      {/* Drill List */}
      {!selectedDrill && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>Drills ({drills.length})</h3>
            <button
              onClick={() => setShowForm(true)}
              disabled={buildings.length === 0}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: buildings.length === 0 ? "#475569" : "#ef4444",
                color: "#fff",
                fontWeight: 600,
                cursor: buildings.length === 0 ? "default" : "pointer",
                opacity: buildings.length === 0 ? 0.5 : 1,
              }}
            >
              + Create Drill
            </button>
          </div>

          {buildings.length === 0 && (
            <p style={{ color: "#94a3b8", marginBottom: 16 }}>
              Create a building first in the Buildings tab before starting drills.
            </p>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
            {drills.map((d) => (
              <div
                key={d.id}
                style={{
                  background: "#1e293b",
                  borderRadius: 10,
                  padding: 16,
                  border: "1px solid #334155",
                  cursor: "pointer",
                }}
                onClick={() => handleViewReport(d)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong>Drill #{d.id.slice(0, 8)}</strong>
                  <StatusBadge status={d.status} />
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                  Scenario: {d.scenario_type} | Floor: {d.hazard_floor}
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Participants: {d.total_participants} | Evacuated: {d.evacuated_count}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Drill Detail / Simulation */}
      {selectedDrill && (
        <div>
          <button
            onClick={() => { setSelectedDrill(null); setDrillStatus(null); setDrillReport(null); setSimulating(false); }}
            style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "#334155", color: "#e2e8f0", cursor: "pointer" }}
          >
            ← Back to Drills
          </button>

          <h3 style={{ fontSize: 18, marginBottom: 12 }}>Drill #{selectedDrill.id.slice(0, 8)}</h3>

          {/* Drill Info */}
          <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #334155" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Scenario</div>
                <div style={{ fontWeight: 600 }}>{selectedDrill.scenario_type}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Hazard Floor</div>
                <div style={{ fontWeight: 600 }}>{selectedDrill.hazard_floor}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Participants</div>
                <div style={{ fontWeight: 600 }}>{selectedDrill.total_participants}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>Status</div>
                <StatusBadge status={selectedDrill.status} />
              </div>
            </div>
          </div>

          {/* Start Button */}
          {selectedDrill.status === "pending" && !simulating && (
            <button
              onClick={() => handleStartDrill(selectedDrill.id)}
              disabled={loading}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                cursor: loading ? "default" : "pointer",
                marginBottom: 16,
              }}
            >
              🚨 Start Evacuation Drill
            </button>
          )}

          {/* Simulation Status */}
          {drillStatus && (
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, marginBottom: 16, border: "1px solid #334155" }}>
              <h4 style={{ marginBottom: 12 }}>📊 Live Status</h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#22c55e" }}>
                    {drillStatus.participants_evacuated}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Evacuated</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#ef4444" }}>
                    {drillStatus.participants_remaining}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Remaining</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6" }}>
                    {Math.floor(drillStatus.elapsed_seconds)}s
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Elapsed</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>Evacuation Progress</span>
                  <span>
                    {drillStatus.participants_evacuated}/{drillStatus.drill.total_participants}
                  </span>
                </div>
                <div style={{ height: 12, background: "#334155", borderRadius: 6, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${(drillStatus.participants_evacuated / drillStatus.drill.total_participants) * 100}%`,
                      background: "#22c55e",
                      borderRadius: 6,
                      transition: "width 0.3s",
                    }}
                  />
                </div>
              </div>

              {simulating && (
                <div style={{ fontSize: 14, color: "#f59e0b", fontWeight: 600 }}>
                  ⚡ Evacuation in progress...
                </div>
              )}
            </div>
          )}

          {/* Drill Report */}
          {drillReport && (
            <DrillReportView report={drillReport} />
          )}
        </div>
      )}

      {/* Create Drill Form Modal */}
      {showForm && (
        <CreateDrillForm
          buildings={buildings}
          onClose={() => setShowForm(false)}
          onSave={handleCreateDrill}
        />
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#713f12", color: "#fde68a" },
    active: { bg: "#7f1d1d", color: "#fca5a5" },
    completed: { bg: "#14532d", color: "#86efac" },
  };
  const style = colors[status] || colors.pending;

  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 10px",
        borderRadius: 6,
        background: style.bg,
        color: style.color,
        fontWeight: 600,
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

// Drill Report View Component
function DrillReportView({ report }: { report: DrillReport }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 10, padding: 16, border: "1px solid #334155" }}>
      <h4 style={{ marginBottom: 12 }}>📋 Drill Report</h4>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>
            {report.success_rate}%
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Success Rate</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>
            {Math.floor(report.total_time_seconds)}s
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Total Time</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}>
            {Math.floor(report.avg_evacuation_time)}s
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Avg Evacuation</div>
        </div>
      </div>

      {/* Floor Times */}
      <h5 style={{ marginBottom: 8, fontSize: 14 }}>Floor Evacuation Times</h5>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(report.floor_times).map(([floor, time]) => (
          <div
            key={floor}
            style={{
              background: "#334155",
              borderRadius: 6,
              padding: "8px 12px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>{Math.floor(time)}s</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Floor {floor}</div>
          </div>
        ))}
      </div>

      {/* Bottlenecks */}
      {report.bottlenecks.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ marginBottom: 8, fontSize: 14, color: "#f59e0b" }}>⚠️ Bottlenecks</h5>
          {report.bottlenecks.map((b, i) => (
            <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
              • {b}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h5 style={{ marginBottom: 8, fontSize: 14, color: "#22c55e" }}>💡 Recommendations</h5>
        {report.recommendations.map((r, i) => (
          <div key={i} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
            • {r}
          </div>
        ))}
      </div>
    </div>
  );
}

// Create Drill Form Component
function CreateDrillForm({
  buildings,
  onClose,
  onSave,
}: {
  buildings: Building[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    building_id: buildings[0]?.id || "",
    scenario_type: "fire",
    hazard_floor: 1,
    hazard_room: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: "#1e293b", borderRadius: 12, padding: 24, width: 400 }}>
        <h3 style={{ marginBottom: 16 }}>Create Evacuation Drill</h3>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Building</span>
          <select
            value={form.building_id}
            onChange={(e) => setForm({ ...form, building_id: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
            required
          >
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Scenario Type</span>
          <select
            value={form.scenario_type}
            onChange={(e) => setForm({ ...form, scenario_type: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
          >
            <option value="fire">🔥 Fire</option>
            <option value="earthquake">🌍 Earthquake</option>
            <option value="gas_leak">💨 Gas Leak</option>
            <option value="structural">🏗️ Structural Damage</option>
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Hazard Floor</span>
          <input
            type="number"
            min="1"
            value={form.hazard_floor}
            onChange={(e) => setForm({ ...form, hazard_floor: parseInt(e.target.value) })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
            required
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Hazard Room (optional)</span>
          <input
            type="text"
            value={form.hazard_room}
            onChange={(e) => setForm({ ...form, hazard_room: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
          />
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "#334155", color: "#e2e8f0", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#ef4444", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Create Drill
          </button>
        </div>
      </form>
    </div>
  );
}
