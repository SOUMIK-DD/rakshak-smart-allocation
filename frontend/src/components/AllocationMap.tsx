import React, { useEffect, useRef } from "react";
import type { Hospital, Victim, AllocationResult } from "../types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  hospitals: Hospital[];
  victims: Victim[];
  results: AllocationResult[];
}

// Fix default marker icon paths for bundled builds
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const severityColor: Record<string, string> = {
  CRITICAL: "#ef4444",
  SEVERE: "#f59e0b",
  MODERATE: "#eab308",
  MILD: "#22c55e",
};

const hospitalIcon = L.divIcon({
  className: "",
  html: `<div style="background:#3b82f6;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #1e3a5f;font-size:16px;">🏥</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function victimIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;">🚑</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function AllocationMap({ hospitals, victims, results }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView([40.7528, -73.9765], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear previous layers (keep tile layer)
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    // Add hospital markers
    hospitals.forEach((h) => {
      L.marker([h.lat, h.lon], { icon: hospitalIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;">
            <strong>${h.name}</strong><br/>
            Beds: ${h.available_beds}/${h.total_beds}<br/>
            ICU: ${h.icu_available}/${h.icu_beds}<br/>
            <small>${h.facilities.join(", ")}</small>
          </div>`
        );
    });

    // Add victim markers
    victims.forEach((v) => {
      const color = severityColor[v.severity] || "#94a3b8";
      L.marker([v.lat, v.lon], { icon: victimIcon(color) })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;">
            <strong>${v.name}</strong><br/>
            Severity: ${v.severity}<br/>
            Age: ${v.age}<br/>
            ${v.needs_icu ? "⚠️ ICU Required" : ""}
          </div>`
        );
    });

    // Draw assignment lines
    results.forEach((r) => {
      const color = severityColor[r.victim.severity] || "#94a3b8";
      L.polyline(
        [
          [r.victim.lat, r.victim.lon],
          [r.hospital.lat, r.hospital.lon],
        ],
        {
          color,
          weight: 2,
          opacity: 0.7,
          dashArray: "6,4",
        }
      )
        .addTo(map)
        .bindPopup(
          `<div style="font-family:sans-serif;">
            <strong>${r.victim.name}</strong> → <strong>${r.hospital.name}</strong><br/>
            Score: ${r.score}/100<br/>
            Distance: ${r.distance_km} km<br/>
            ETA: ~${r.travel_time_min} min
          </div>`
        );
    });

    // Fit bounds if we have data
    const allPoints: L.LatLngExpression[] = [
      ...hospitals.map((h) => [h.lat, h.lon] as [number, number]),
      ...victims.map((v) => [v.lat, v.lon] as [number, number]),
    ];
    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints).pad(0.1));
    }
  }, [hospitals, victims, results]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 12, fontSize: 20 }}>🗺️ Allocation Map</h2>
      <div
        ref={mapRef}
        style={{
          height: 500,
          borderRadius: 10,
          border: "1px solid #334155",
          overflow: "hidden",
        }}
      />
      <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
        🏥 Hospitals &nbsp; 🚑 Victims (colored by severity) &nbsp; --- Assignment lines
      </div>
    </div>
  );
}
