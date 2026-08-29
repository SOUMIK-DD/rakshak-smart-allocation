import React from "react";
import type { Victim } from "../types";

interface Props {
  victims: Victim[];
  onAllocateAll: () => void;
  onAllocateOne: (victimId: string) => void;
  loading: boolean;
}

const severityStyle: Record<string, { bg: string; color: string }> = {
  CRITICAL: { bg: "#7f1d1d", color: "#fca5a5" },
  SEVERE: { bg: "#78350f", color: "#fcd34d" },
  MODERATE: { bg: "#713f12", color: "#fde68a" },
  MILD: { bg: "#14532d", color: "#86efac" },
};

export default function VictimList({ victims, onAllocateAll, onAllocateOne, loading }: Props) {
  const unassigned = victims.filter((v) => !v.assigned_hospital_id);
  const assigned = victims.filter((v) => v.assigned_hospital_id);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20 }}>🚑 Victims ({victims.length})</h2>
        <button
          onClick={onAllocateAll}
          disabled={loading || unassigned.length === 0}
          style={{
            padding: "10px 24px",
            borderRadius: 8,
            border: "none",
            background: unassigned.length === 0 ? "#334155" : "#2563eb",
            color: "#f8fafc",
            fontWeight: 600,
            fontSize: 14,
            cursor: unassigned.length === 0 ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "⏳ Allocating…" : `⚡ Allocate All (${unassigned.length})`}
        </button>
      </div>

      {unassigned.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>
            ⏳ Waiting for allocation
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10, marginBottom: 24 }}>
            {unassigned.map((v) => (
              <VictimCard key={v.id} victim={v} onAllocate={onAllocateOne} loading={loading} />
            ))}
          </div>
        </>
      )}

      {assigned.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: "#94a3b8", marginBottom: 8 }}>
            ✅ Assigned
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 10 }}>
            {assigned.map((v) => (
              <VictimCard key={v.id} victim={v} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VictimCard({
  victim,
  onAllocate,
  loading,
}: {
  victim: Victim;
  onAllocate?: (id: string) => void;
  loading?: boolean;
}) {
  const s = severityStyle[victim.severity] || severityStyle.MODERATE;
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: 10,
        padding: 14,
        border: "1px solid #334155",
        opacity: victim.assigned_hospital_id ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <strong>{victim.name}</strong>
        <span
          style={{
            fontSize: 11,
            padding: "2px 10px",
            borderRadius: 6,
            background: s.bg,
            color: s.color,
            fontWeight: 600,
          }}
        >
          {victim.severity}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "#cbd5e1", marginBottom: 4 }}>
        Age: {victim.age} &nbsp;|&nbsp; ICU: {victim.needs_icu ? "🔴 Required" : "—"}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
        Conditions: {victim.conditions.join(", ") || "None"}
      </div>
      {victim.assigned_hospital_id && (
        <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 6 }}>
          ✅ Assigned to hospital
        </div>
      )}
      {!victim.assigned_hospital_id && onAllocate && (
        <button
          onClick={() => onAllocate(victim.id)}
          disabled={loading}
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          Allocate
        </button>
      )}
    </div>
  );
}
