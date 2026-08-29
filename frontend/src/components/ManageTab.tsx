import React, { useState } from "react";
import type { Hospital, Victim } from "../types";
import {
  createHospital,
  updateHospital,
  deleteHospital,
  createVictim,
  updateVictim,
  deleteVictim,
} from "../api";

interface Props {
  hospitals: Hospital[];
  victims: Victim[];
  onRefresh: () => void;
}

export default function ManageTab({ hospitals, victims, onRefresh }: Props) {
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [editingVictim, setEditingVictim] = useState<Victim | null>(null);
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [showVictimForm, setShowVictimForm] = useState(false);

  const handleDeleteHospital = async (id: string) => {
    if (confirm("Delete this hospital?")) {
      await deleteHospital(id);
      onRefresh();
    }
  };

  const handleDeleteVictim = async (id: string) => {
    if (confirm("Delete this victim?")) {
      await deleteVictim(id);
      onRefresh();
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>⚙️ Manage Data</h2>

      {/* Hospitals Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>🏥 Hospitals ({hospitals.length})</h3>
          <button
            onClick={() => { setEditingHospital(null); setShowHospitalForm(true); }}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Hospital
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
          {hospitals.map((h) => (
            <div key={h.id} style={{ background: "#1e293b", borderRadius: 8, padding: 12, border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <strong>{h.name}</strong>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => { setEditingHospital(h); setShowHospitalForm(true); }}
                    style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#3b82f6", color: "#fff", fontSize: 11, cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHospital(h.id)}
                    style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Beds: {h.available_beds}/{h.total_beds} | ICU: {h.icu_available}/{h.icu_beds}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Victims Section */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 16 }}>🚑 Victims ({victims.length})</h3>
          <button
            onClick={() => { setEditingVictim(null); setShowVictimForm(true); }}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#22c55e",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add Victim
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
          {victims.map((v) => (
            <div key={v.id} style={{ background: "#1e293b", borderRadius: 8, padding: 12, border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <strong>{v.name}</strong>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => { setEditingVictim(v); setShowVictimForm(true); }}
                    style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#3b82f6", color: "#fff", fontSize: 11, cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVictim(v.id)}
                    style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {v.severity} | Age: {v.age} | ICU: {v.needs_icu ? "Yes" : "No"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Form Modal */}
      {showHospitalForm && (
        <HospitalForm
          hospital={editingHospital}
          onClose={() => { setShowHospitalForm(false); setEditingHospital(null); }}
          onSave={async (data) => {
            if (editingHospital) {
              await updateHospital(editingHospital.id, data);
            } else {
              await createHospital(data);
            }
            setShowHospitalForm(false);
            setEditingHospital(null);
            onRefresh();
          }}
        />
      )}

      {/* Victim Form Modal */}
      {showVictimForm && (
        <VictimForm
          victim={editingVictim}
          onClose={() => { setShowVictimForm(false); setEditingVictim(null); }}
          onSave={async (data) => {
            if (editingVictim) {
              await updateVictim(editingVictim.id, data);
            } else {
              await createVictim(data);
            }
            setShowVictimForm(false);
            setEditingVictim(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Hospital Form Component
function HospitalForm({
  hospital,
  onClose,
  onSave,
}: {
  hospital: Hospital | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: hospital?.name || "",
    lat: hospital?.lat || 40.75,
    lon: hospital?.lon || -73.98,
    total_beds: hospital?.total_beds || 100,
    available_beds: hospital?.available_beds || 50,
    icu_beds: hospital?.icu_beds || 10,
    icu_available: hospital?.icu_available || 5,
    facilities: hospital?.facilities?.join(", ") || "emergency, general",
    staff_level: hospital?.staff_level || "MODERATE",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      facilities: form.facilities.split(",").map((f) => f.trim()).filter(Boolean),
    });
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: "#1e293b", borderRadius: 12, padding: 24, width: 400, maxHeight: "80vh", overflow: "auto" }}>
        <h3 style={{ marginBottom: 16 }}>{hospital ? "Edit Hospital" : "Add Hospital"}</h3>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
            required
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Latitude</span>
            <input
              type="number"
              step="0.0001"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Longitude</span>
            <input
              type="number"
              step="0.0001"
              value={form.lon}
              onChange={(e) => setForm({ ...form, lon: parseFloat(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Total Beds</span>
            <input
              type="number"
              value={form.total_beds}
              onChange={(e) => setForm({ ...form, total_beds: parseInt(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Available Beds</span>
            <input
              type="number"
              value={form.available_beds}
              onChange={(e) => setForm({ ...form, available_beds: parseInt(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>ICU Beds</span>
            <input
              type="number"
              value={form.icu_beds}
              onChange={(e) => setForm({ ...form, icu_beds: parseInt(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>ICU Available</span>
            <input
              type="number"
              value={form.icu_available}
              onChange={(e) => setForm({ ...form, icu_available: parseInt(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
        </div>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Facilities (comma-separated)</span>
          <input
            type="text"
            value={form.facilities}
            onChange={(e) => setForm({ ...form, facilities: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Staff Level</span>
          <select
            value={form.staff_level}
            onChange={(e) => setForm({ ...form, staff_level: e.target.value as any })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
          >
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="FULL">Full</option>
          </select>
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "#334155", color: "#e2e8f0", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

// Victim Form Component
function VictimForm({
  victim,
  onClose,
  onSave,
}: {
  victim: Victim | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: victim?.name || "",
    lat: victim?.lat || 40.75,
    lon: victim?.lon || -73.98,
    severity: victim?.severity || "MODERATE",
    conditions: victim?.conditions?.join(", ") || "general",
    age: victim?.age || 30,
    needs_icu: victim?.needs_icu || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      conditions: form.conditions.split(",").map((c) => c.trim()).filter(Boolean),
    });
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: "#1e293b", borderRadius: 12, padding: 24, width: 400, maxHeight: "80vh", overflow: "auto" }}>
        <h3 style={{ marginBottom: 16 }}>{victim ? "Edit Victim" : "Add Victim"}</h3>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
            required
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Latitude</span>
            <input
              type="number"
              step="0.0001"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Longitude</span>
            <input
              type="number"
              step="0.0001"
              value={form.lon}
              onChange={(e) => setForm({ ...form, lon: parseFloat(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Severity</span>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as any })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
            >
              <option value="CRITICAL">Critical</option>
              <option value="SEVERE">Severe</option>
              <option value="MODERATE">Moderate</option>
              <option value="MILD">Mild</option>
            </select>
          </label>
          <label>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Age</span>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })}
              style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
              required
            />
          </label>
        </div>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Conditions (comma-separated)</span>
          <input
            type="text"
            value={form.conditions}
            onChange={(e) => setForm({ ...form, conditions: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
          />
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={form.needs_icu}
            onChange={(e) => setForm({ ...form, needs_icu: e.target.checked })}
          />
          <span style={{ fontSize: 14 }}>Needs ICU</span>
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "#334155", color: "#e2e8f0", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
