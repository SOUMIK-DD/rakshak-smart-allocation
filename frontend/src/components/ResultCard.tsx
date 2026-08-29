import React from "react";
import type { AllocationResult } from "../types";

interface Props {
  results: AllocationResult[];
}

const severityColor: Record<string, string> = {
  CRITICAL: "#ef4444",
  SEVERE: "#f59e0b",
  MODERATE: "#eab308",
  MILD: "#22c55e",
};

function scoreColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  if (score >= 30) return "#f59e0b";
  return "#ef4444";
}

export default function ResultCard({ results }: Props) {
  if (results.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 12 }}>📋 Allocation Results</h2>
        <p style={{ color: "#64748b" }}>
          No allocations yet. Click "Allocate All" or register victims first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 16 }}>📋 Allocation Results ({results.length})</h2>

      {/* Summary bar */}
      <div
        style={{
          background: "#1e293b",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
          border: "1px solid #334155",
          display: "flex",
          gap: 32,
          fontSize: 14,
        }}
      >
        <div>
          <span style={{ color: "#94a3b8" }}>Avg Score: </span>
          <strong>
            {(results.reduce((s, r) => s + r.score, 0) / results.length).toFixed(1)}
          </strong>
        </div>
        <div>
          <span style={{ color: "#94a3b8" }}>Avg Travel: </span>
          <strong>
            {(results.reduce((s, r) => s + r.travel_time_min, 0) / results.length).toFixed(1)} min
          </strong>
        </div>
        <div>
          <span style={{ color: "#94a3b8" }}>Critical Assigned: </span>
          <strong>
            {results.filter((r) => r.victim.severity === "CRITICAL").length}
          </strong>
        </div>
      </div>

      {/* Result cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 12 }}>
        {results.map((r, i) => {
          const sc = scoreColor(r.score);
          return (
            <div
              key={`${r.victim.id}-${i}`}
              style={{
                background: "#1e293b",
                borderRadius: 10,
                padding: 16,
                border: "1px solid #334155",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "#334155",
                      color: "#94a3b8",
                      marginRight: 8,
                    }}
                  >
                    #{r.priority_rank}
                  </span>
                  <strong>{r.victim.name}</strong>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 10px",
                    borderRadius: 6,
                    background: severityColor[r.victim.severity] + "33",
                    color: severityColor[r.victim.severity],
                    fontWeight: 600,
                  }}
                >
                  {r.victim.severity}
                </span>
              </div>

              {/* Arrow */}
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
                → {r.hospital.name}
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: "#cbd5e1" }}>Allocation Score</span>
                  <strong style={{ color: sc }}>{r.score}/100</strong>
                </div>
                <div style={{ height: 8, background: "#334155", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${r.score}%`,
                      background: sc,
                      borderRadius: 4,
                      transition: "width 0.5s",
                    }}
                  />
                </div>
              </div>

              {/* Travel info */}
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                <span>📏 {r.distance_km} km</span>
                <span>⏱️ ~{r.travel_time_min} min</span>
              </div>

              {/* Reasons */}
              <div style={{ borderTop: "1px solid #334155", paddingTop: 8 }}>
                {r.reasons.map((reason, j) => (
                  <div key={j} style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>
                    • {reason}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
