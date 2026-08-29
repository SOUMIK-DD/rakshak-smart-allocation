import React, { useState, useEffect, useRef } from "react";
import type { Building, BuildingDetail, Floor, Room } from "../types";
import { getBuildingDetail, createBuilding, deleteBuilding } from "../api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  buildings: Building[];
  onRefresh: () => void;
}

export default function BuildingsTab({ buildings, onRefresh }: Props) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingDetail | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectBuilding = async (building: Building) => {
    setLoading(true);
    try {
      const detail = await getBuildingDetail(building.id);
      setSelectedBuilding(detail);
      setSelectedFloor(1);
    } catch (err) {
      console.error("Failed to load building:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBuilding = async (id: string) => {
    if (confirm("Delete this building?")) {
      await deleteBuilding(id);
      setSelectedBuilding(null);
      onRefresh();
    }
  };

  const currentRooms = selectedBuilding?.rooms_by_floor[selectedFloor] || [];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>🏢 Indoor Emergency Model</h2>

      {/* Building List */}
      {!selectedBuilding && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 16 }}>Buildings ({buildings.length})</h3>
            <button
              onClick={() => setShowForm(true)}
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
              + Add Building
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {buildings.map((b) => (
              <div
                key={b.id}
                style={{
                  background: "#1e293b",
                  borderRadius: 10,
                  padding: 16,
                  border: "1px solid #334155",
                  cursor: "pointer",
                }}
                onClick={() => handleSelectBuilding(b)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <strong>{b.name}</strong>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(b.id); }}
                    style={{ padding: "4px 8px", borderRadius: 4, border: "none", background: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  {b.num_floors} floors | {b.address || "No address"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Building Detail View */}
      {selectedBuilding && (
        <div>
          <button
            onClick={() => setSelectedBuilding(null)}
            style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "#334155", color: "#e2e8f0", cursor: "pointer" }}
          >
            ← Back to Buildings
          </button>

          <h3 style={{ fontSize: 18, marginBottom: 12 }}>{selectedBuilding.building.name}</h3>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>
            {selectedBuilding.building.num_floors} floors | {selectedBuilding.building.address}
          </p>

          {/* Floor Selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {selectedBuilding.floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setSelectedFloor(floor.floor_number)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: selectedFloor === floor.floor_number ? "#3b82f6" : "#334155",
                  color: "#e2e8f0",
                  fontWeight: selectedFloor === floor.floor_number ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                Floor {floor.floor_number}
              </button>
            ))}
          </div>

          {/* Floor Plan */}
          <FloorPlan rooms={currentRooms} floorNumber={selectedFloor} />
        </div>
      )}

      {/* Add Building Form Modal */}
      {showForm && (
        <BuildingForm
          onClose={() => setShowForm(false)}
          onSave={async (data) => {
            await createBuilding(data);
            setShowForm(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// Floor Plan Component
function FloorPlan({ rooms, floorNumber }: { rooms: Room[]; floorNumber: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      crs: L.CRS.Simple,
      minZoom: -2,
      maxZoom: 2,
    }).setView([0, 0], 0);

    mapInstance.current = map;

    // Draw rooms
    rooms.forEach((room) => {
      let color = "#475569"; // Default gray
      if (room.is_exit) color = "#22c55e"; // Green for exits
      else if (room.is_stairwell) color = "#3b82f6"; // Blue for stairwells
      else if (room.is_hazard) color = "#ef4444"; // Red for hazards

      const bounds: L.LatLngExpression[] = [
        [room.y, room.x],
        [room.y + room.height, room.x + room.width],
      ];

      L.rectangle(bounds as any, {
        color: color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.4,
      })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;">
            <strong>${room.name}</strong><br/>
            Type: ${room.room_type}<br/>
            Occupancy: ${room.occupancy}<br/>
            ${room.is_exit ? "🚪 EXIT" : ""}
            ${room.is_stairwell ? "🪜 STAIRWELL" : ""}
            ${room.is_hazard ? "⚠️ HAZARD" : ""}
          </div>`
        );
    });

    // Fit bounds
    if (rooms.length > 0) {
      const allBounds = rooms.map((r) => [
        [r.y, r.x],
        [r.y + r.height, r.x + r.width],
      ] as L.LatLngBoundsExpression);
      const bounds = L.latLngBounds(allBounds.flat() as L.LatLngExpression[]);
      map.fitBounds(bounds.pad(0.2));
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [rooms]);

  return (
    <div>
      <h4 style={{ marginBottom: 8 }}>Floor {floorNumber} Layout</h4>
      <div
        ref={mapRef}
        style={{
          height: 400,
          borderRadius: 10,
          border: "1px solid #334155",
          overflow: "hidden",
          background: "#0f172a",
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        <span style={{ color: "#22c55e" }}>■</span> Exit &nbsp;
        <span style={{ color: "#3b82f6" }}>■</span> Stairwell &nbsp;
        <span style={{ color: "#475569" }}>■</span> Room &nbsp;
        <span style={{ color: "#ef4444" }}>■</span> Hazard
      </div>
    </div>
  );
}

// Building Form Component
function BuildingForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    lat: 40.75,
    lon: -73.98,
    num_floors: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <form onSubmit={handleSubmit} style={{ background: "#1e293b", borderRadius: 12, padding: 24, width: 400 }}>
        <h3 style={{ marginBottom: 16 }}>Add Building</h3>

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

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Address</span>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
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

        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Number of Floors</span>
          <input
            type="number"
            min="1"
            max="100"
            value={form.num_floors}
            onChange={(e) => setForm({ ...form, num_floors: parseInt(e.target.value) })}
            style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #475569", background: "#0f172a", color: "#e2e8f0", marginTop: 4 }}
            required
          />
        </label>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #475569", background: "#334155", color: "#e2e8f0", cursor: "pointer" }}>
            Cancel
          </button>
          <button type="submit" style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#22c55e", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Create Building
          </button>
        </div>
      </form>
    </div>
  );
}
