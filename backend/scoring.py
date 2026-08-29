"""Multi-factor scoring algorithm for smart hospital allocation."""

from __future__ import annotations

from dataclasses import dataclass, field

from models import Hospital, Victim, Severity, AllocationCandidate
from routing import get_route


# ---------------------------------------------------------------------------
# Configurable weights
# ---------------------------------------------------------------------------

@dataclass
class ScoringWeights:
    distance: float = 0.25
    capacity: float = 0.25
    icu: float = 0.20
    facilities: float = 0.15
    severity_match: float = 0.15

    def normalised(self) -> ScoringWeights:
        total = (
            self.distance
            + self.capacity
            + self.icu
            + self.facilities
            + self.severity_match
        )
        if total == 0:
            return ScoringWeights()
        return ScoringWeights(
            distance=self.distance / total,
            capacity=self.capacity / total,
            icu=self.icu / total,
            facilities=self.facilities / total,
            severity_match=self.severity_match / total,
        )


DEFAULT_WEIGHTS = ScoringWeights()

# Maximum distance (km) used to normalise the distance score
MAX_DISTANCE_KM = 80.0

# Penalty multiplier when a hospital has < 10 % available beds
OVERCROWDING_THRESHOLD = 0.10
OVERCROWDING_PENALTY = 0.5

# Severity → facility keywords that indicate a good match
SEVERITY_FACILITY_MAP: dict[Severity, list[str]] = {
    Severity.CRITICAL: ["trauma", "icu", "emergency"],
    Severity.SEVERE: ["trauma", "emergency", "surgery"],
    Severity.MODERATE: ["emergency", "general"],
    Severity.MILD: ["general", "clinic"],
}


# ---------------------------------------------------------------------------
# Individual score components (each returns 0–100)
# ---------------------------------------------------------------------------

def _distance_score(distance_km: float) -> float:
    """Closer is better. Linear decay to zero at MAX_DISTANCE_KM."""
    return max(0.0, 100.0 * (1.0 - distance_km / MAX_DISTANCE_KM))


def _capacity_score(hospital: Hospital) -> float:
    """Percentage of beds available."""
    if hospital.total_beds == 0:
        return 0.0
    return (hospital.available_beds / hospital.total_beds) * 100.0


def _icu_score(hospital: Hospital, victim: Victim) -> float:
    """ICU match scoring."""
    if victim.needs_icu:
        if hospital.icu_available > 0:
            return 100.0
        return 0.0  # critical mismatch
    # Not needing ICU — bonus if available, but not essential
    if hospital.icu_beds > 0:
        return 50.0
    return 50.0  # neutral


def _facilities_score(hospital: Hospital, victim: Victim) -> float:
    """How well the hospital's facilities match the victim's conditions."""
    if not victim.conditions:
        return 70.0  # no specific needs — baseline
    matched = sum(1 for c in victim.conditions if c in hospital.facilities)
    return (matched / len(victim.conditions)) * 100.0


def _severity_match_score(hospital: Hospital, victim: Victim) -> float:
    """Does the hospital specialise in what this severity level needs?"""
    required = SEVERITY_FACILITY_MAP.get(victim.severity, [])
    if not required:
        return 60.0
    matched = sum(1 for r in required if r in hospital.facilities)
    return (matched / len(required)) * 100.0


# ---------------------------------------------------------------------------
# Composite scoring
# ---------------------------------------------------------------------------

async def score_hospital(
    hospital: Hospital,
    victim: Victim,
    weights: ScoringWeights | None = None,
) -> AllocationCandidate:
    """Score a single hospital for a single victim. Returns an AllocationCandidate."""
    w = (weights or DEFAULT_WEIGHTS).normalised()

    dist_km, travel_min = await get_route(
        victim.lat, victim.lon, hospital.lat, hospital.lon
    )

    d_score = _distance_score(dist_km)
    c_score = _capacity_score(hospital)
    i_score = _icu_score(hospital, victim)
    f_score = _facilities_score(hospital, victim)
    s_score = _severity_match_score(hospital, victim)

    raw = (
        w.distance * d_score
        + w.capacity * c_score
        + w.icu * i_score
        + w.facilities * f_score
        + w.severity_match * s_score
    )

    # Overcrowding penalty
    cap_pct = hospital.capacity_pct()
    if cap_pct < OVERCROWDING_THRESHOLD and cap_pct > 0:
        raw *= OVERCROWDING_PENALTY

    score = round(min(100.0, max(0.0, raw)), 1)

    # Build human-readable reasons
    reasons: list[str] = []
    reasons.append(f"Distance: {dist_km:.1f} km (~{travel_min:.0f} min)")
    reasons.append(
        f"Bed capacity: {hospital.available_beds}/{hospital.total_beds} "
        f"({c_score:.0f}%)"
    )
    if victim.needs_icu:
        reasons.append(
            f"ICU: {'✅ available' if hospital.icu_available > 0 else '❌ unavailable'}"
        )
    if f_score == 100:
        reasons.append("All required facilities available")
    elif f_score > 0:
        reasons.append(f"Partial facility match ({f_score:.0f}%)")
    else:
        reasons.append("No facility match")
    if cap_pct < OVERCROWDING_THRESHOLD:
        reasons.append(
            f"⚠️ Overcrowding penalty applied ({cap_pct*100:.0f}% capacity)"
        )

    return AllocationCandidate(
        hospital=hospital,
        score=score,
        distance_km=round(dist_km, 2),
        travel_time_min=round(travel_min, 1),
        reasons=reasons,
    )


async def find_best_hospital(
    victim: Victim,
    hospitals: list[Hospital],
    weights: ScoringWeights | None = None,
) -> AllocationCandidate | None:
    """Find the single best hospital for a victim from a list."""
    if not hospitals:
        return None

    candidates = []
    for h in hospitals:
        c = await score_hospital(h, victim, weights)
        candidates.append(c)

    candidates.sort(key=lambda c: c.score, reverse=True)
    return candidates[0] if candidates else None
