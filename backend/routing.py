"""OSM routing via OSRM public API with Haversine fallback and caching."""

from __future__ import annotations

import math
from typing import Tuple

import httpx

# Simple in-memory cache: (lat1, lon1, lat2, lon2) → (km, minutes)
_cache: dict[Tuple[float, float, float, float], Tuple[float, float]] = {}

OSRM_BASE = "http://router.project-osrm.org/route/v1/driving"
TIMEOUT = 5  # seconds


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _estimate_time_min(distance_km: float) -> float:
    """Rough travel-time estimate assuming 30 km/h avg city speed."""
    return (distance_km / 30.0) * 60.0


async def get_route(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> Tuple[float, float]:
    """Return (distance_km, travel_time_min) between two points.

    Uses OSRM when available; falls back to Haversine + estimate.
    """
    key = (round(lat1, 6), round(lon1, 6), round(lat2, 6), round(lon2, 6))
    if key in _cache:
        return _cache[key]

    # OSRM expects lon,lat order
    url = f"{OSRM_BASE}/{lon1},{lat1};{lon2},{lat2}?overview=false"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            dist_km = route["distance"] / 1000.0
            time_min = route["duration"] / 60.0
            _cache[key] = (dist_km, time_min)
            return dist_km, time_min
    except Exception:
        pass  # fall through to Haversine

    dist_km = _haversine_km(lat1, lon1, lat2, lon2)
    time_min = _estimate_time_min(dist_km)
    _cache[key] = (dist_km, time_min)
    return dist_km, time_min
