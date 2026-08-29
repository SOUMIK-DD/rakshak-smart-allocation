import React from "react";
import type { DashboardStats, Hospital } from "../types";

interface Props {
  stats: DashboardStats | null;
  hospitals: Hospital[];
}

const severityColor = (pct: number) =>
  pct > 50 ? "#22c55e" : pct > 20 ? "#eab308" : "#ef4444";

const staffBadge: Record<string, { bg: string; label: string }> = {
  FULL: { bg: "#166534", label: "🟢 Full Staff" },
  MODERATE: { bg: "#854d0e", label: "🟡 Moderate" },
  LOW: { bg: "#991b1b", label: "🔴 Low" },
};

export default function Dashboard({ stats, hospitals }: Props) {
  if (!stats) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 16, fontSize: 20 }}>📊 Overview</h2>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        <Card label="Hospitals" value={stats.total_hospitals} />
        <Card
          label="Bed Utilization"
          value={`${stats.utilization_pct}%`}
          color={severityColor(100 - stats.utilization_pct)}
        />
        <Card
          label="Available Beds"
          value={`${stats.available_beds} / ${stats.total_beds}`}
        />
        <Card
          label="ICU Utilization"
          value={`${stats.icu_utilization_pct}%`}
          color={severityColor(100 - stats.icu_utilization_pct)}
        />
        <Card label="Total Victims" value={stats.total_victims} />
        <Card
          label="Assigned"
          value={stats.assigned_victims}
          color="#22c55e"
        />
        <Card
          label="Unassigned"
          value={stats.unassigned_victims}
          color="#ef4444"
        />
      </div>

      {/* Hospital list */}
      <h2 style={{ marginBottom: 12, fontSize: 20 }}>🏥 Hospitals</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 12 }}>
        {hospitals.map((h) => {
          const bedPct = h.total_beds ? (h.available_beds / h.total_beds) * 100 : 0;
          const icuPct = h.icu_beds ? (h.icu_available / h.icu_beds) * 100 : 0;
          const staff = staffBadge[h.staff_level] || staffBadge.MODERATE;
          return (
            <div
              key={h.id}
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: 16,
                border: "1px solid #334155",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 15 }}>{h.name}</strong>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: staff.bg,
                  }}
                >
                  {staff.label}
                </span>
              </div>
              <Bar label="Beds" pct={bedPct} detail={`${h.available_beds}/${h.total_beds}`} />
              <Bar label="ICU" pct={icuPct} detail={`${h.icu_available}/${h.icu_beds}`} />
              <div style={{ marginTop: 6, fontSize: 12, color: "#94a3b8" }}>
                Facilities: {h.facilities.join(", ")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 10,
        padding: 16,
        textAlign: "center",
        border: "1px solid #334155",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: color || "#f8fafc" }}>
        {value}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Bar({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  const color = pct > 50 ? "#22c55e" : pct > 20 ? "#eab308" : "#ef4444";
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#cbd5e1", marginBottom: 2 }}>
        <span>{label} available</span>
        <span>{detail}</span>
      </div>
      <div style={{ height: 8, background: "#334155", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.max(pct, 2)}%`, background: color, borderRadius: 4, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}
