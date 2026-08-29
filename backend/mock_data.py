"""Real Odisha hospital and victim data for the disaster management system."""

from __future__ import annotations

import random

from models import Hospital, Victim, Severity, StaffLevel


# ---------------------------------------------------------------------------
# Real Odisha Hospitals (verified data from public sources)
# ---------------------------------------------------------------------------

_HOSPITAL_TEMPLATES: list[dict] = [
    {
        "name": "AIIMS Bhubaneswar",
        "lat": 20.2285,
        "lon": 85.7936,
        "total_beds": 1500,
        "icu_beds": 150,
        "facilities": ["trauma", "icu", "emergency", "surgery", "cardiac", "neurology", "burns", "pediatric"],
        "staff_level": StaffLevel.FULL,
    },
    {
        "name": "SCB Medical College & Hospital, Cuttack",
        "lat": 20.4733,
        "lon": 85.8848,
        "total_beds": 1500,
        "icu_beds": 120,
        "facilities": ["trauma", "emergency", "surgery", "general", "burns", "cardiac"],
        "staff_level": StaffLevel.FULL,
    },
    {
        "name": "KIMS Hospital Bhubaneswar",
        "lat": 20.3010,
        "lon": 85.8170,
        "total_beds": 2600,
        "icu_beds": 600,
        "facilities": ["trauma", "icu", "emergency", "surgery", "cardiac", "neurology", "burns", "pediatric"],
        "staff_level": StaffLevel.FULL,
    },
    {
        "name": "IMS & SUM Hospital Bhubaneswar",
        "lat": 20.2990,
        "lon": 85.8220,
        "total_beds": 1750,
        "icu_beds": 200,
        "facilities": ["trauma", "emergency", "surgery", "cardiac", "neurology", "pediatric"],
        "staff_level": StaffLevel.FULL,
    },
    {
        "name": "Capital Hospital Bhubaneswar",
        "lat": 20.2750,
        "lon": 85.8250,
        "total_beds": 1000,
        "icu_beds": 80,
        "facilities": ["trauma", "emergency", "surgery", "general", "burns"],
        "staff_level": StaffLevel.FULL,
    },
    {
        "name": "Hi-Tech Medical College & Hospital",
        "lat": 20.3150,
        "lon": 85.7950,
        "total_beds": 500,
        "icu_beds": 50,
        "facilities": ["trauma", "emergency", "surgery", "general", "pediatric"],
        "staff_level": StaffLevel.MODERATE,
    },
    {
        "name": "Kalinga Hospital Bhubaneswar",
        "lat": 20.2850,
        "lon": 85.8150,
        "total_beds": 250,
        "icu_beds": 30,
        "facilities": ["emergency", "surgery", "cardiac", "general"],
        "staff_level": StaffLevel.MODERATE,
    },
    {
        "name": "AMRI Hospital Bhubaneswar",
        "lat": 20.2900,
        "lon": 85.8200,
        "total_beds": 400,
        "icu_beds": 40,
        "facilities": ["emergency", "surgery", "cardiac", "icu", "trauma"],
        "staff_level": StaffLevel.FULL,
    },
    {
        "name": "VSS Medical College, Sambalpur",
        "lat": 21.1920,
        "lon": 83.9570,
        "total_beds": 1000,
        "icu_beds": 80,
        "facilities": ["trauma", "emergency", "surgery", "general"],
        "staff_level": StaffLevel.MODERATE,
    },
    {
        "name": "MKCG Medical College, Berhampur",
        "lat": 19.3150,
        "lon": 84.7930,
        "total_beds": 1000,
        "icu_beds": 70,
        "facilities": ["trauma", "emergency", "surgery", "general", "burns"],
        "staff_level": StaffLevel.MODERATE,
    },
    {
        "name": "PRM Medical College, Baripada",
        "lat": 21.9300,
        "lon": 86.7300,
        "total_beds": 500,
        "icu_beds": 40,
        "facilities": ["emergency", "surgery", "general"],
        "staff_level": StaffLevel.MODERATE,
    },
    {
        "name": "SLN Medical College, Koraput",
        "lat": 18.8100,
        "lon": 82.7100,
        "total_beds": 500,
        "icu_beds": 30,
        "facilities": ["emergency", "surgery", "general"],
        "staff_level": StaffLevel.LOW,
    },
    {
        "name": "Fakir Mohan Medical College, Balasore",
        "lat": 21.4900,
        "lon": 86.9400,
        "total_beds": 500,
        "icu_beds": 35,
        "facilities": ["emergency", "surgery", "general"],
        "staff_level": StaffLevel.MODERATE,
    },
    {
        "name": "VIMSAR Burla",
        "lat": 21.1800,
        "lon": 83.9600,
        "total_beds": 800,
        "icu_beds": 60,
        "facilities": ["trauma", "emergency", "surgery", "general"],
        "staff_level": StaffLevel.MODERATE,
    },
]


# ---------------------------------------------------------------------------
# Real Odisha victim scenarios (Indian names, Odisha cities)
# ---------------------------------------------------------------------------

_VICTIM_TEMPLATES: list[dict] = [
    {"name": "Rajesh Kumar", "lat": 20.2960, "lon": 85.8240, "severity": Severity.CRITICAL, "conditions": ["trauma", "cardiac"], "age": 55, "needs_icu": True},
    {"name": "Sunita Devi", "lat": 20.4620, "lon": 85.8750, "severity": Severity.SEVERE, "conditions": ["burns"], "age": 34, "needs_icu": True},
    {"name": "Priyanka Mohapatra", "lat": 20.2880, "lon": 85.8180, "severity": Severity.MODERATE, "conditions": ["trauma"], "age": 28, "needs_icu": False},
    {"name": "Amit Behera", "lat": 21.1850, "lon": 83.9500, "severity": Severity.MILD, "conditions": ["general"], "age": 22, "needs_icu": False},
    {"name": "Sarojini Das", "lat": 19.3080, "lon": 84.7880, "severity": Severity.CRITICAL, "conditions": ["neurology", "trauma"], "age": 67, "needs_icu": True},
    {"name": "Manoj Pattnaik", "lat": 20.2790, "lon": 85.8300, "severity": Severity.SEVERE, "conditions": ["burns", "trauma"], "age": 41, "needs_icu": True},
    {"name": "Deepak Sahu", "lat": 20.4680, "lon": 85.8800, "severity": Severity.MODERATE, "conditions": ["cardiac"], "age": 50, "needs_icu": False},
    {"name": "Anjali Nayak", "lat": 20.3050, "lon": 85.8100, "severity": Severity.MILD, "conditions": ["general"], "age": 19, "needs_icu": False},
    {"name": "Ravi Sharma", "lat": 21.4850, "lon": 86.9350, "severity": Severity.MODERATE, "conditions": ["pediatric", "general"], "age": 8, "needs_icu": False},
    {"name": "Sangeeta Jena", "lat": 20.2820, "lon": 85.8220, "severity": Severity.SEVERE, "conditions": ["cardiac", "icu"], "age": 72, "needs_icu": True},
    {"name": "Bikash Swain", "lat": 18.8050, "lon": 82.7050, "severity": Severity.CRITICAL, "conditions": ["trauma", "emergency"], "age": 37, "needs_icu": True},
    {"name": "Lata Reddy", "lat": 20.2920, "lon": 85.8160, "severity": Severity.MILD, "conditions": ["general", "clinic"], "age": 29, "needs_icu": False},
    {"name": "Prakash Tripathy", "lat": 20.4700, "lon": 85.8780, "severity": Severity.MODERATE, "conditions": ["trauma", "surgery"], "age": 45, "needs_icu": False},
    {"name": "Kavita Pradhan", "lat": 20.2950, "lon": 85.8250, "severity": Severity.SEVERE, "conditions": ["burns", "icu"], "age": 60, "needs_icu": True},
    {"name": "Suresh Mishra", "lat": 21.9250, "lon": 86.7250, "severity": Severity.MILD, "conditions": ["general"], "age": 31, "needs_icu": False},
    {"name": "Jyoti Prakash", "lat": 21.1880, "lon": 83.9550, "severity": Severity.MODERATE, "conditions": ["neurology"], "age": 53, "needs_icu": False},
    {"name": "Radha Rani", "lat": 19.3100, "lon": 84.7900, "severity": Severity.CRITICAL, "conditions": ["cardiac", "trauma", "icu"], "age": 64, "needs_icu": True},
    {"name": "Ganesh Panda", "lat": 20.3000, "lon": 85.8200, "severity": Severity.MODERATE, "conditions": ["emergency"], "age": 40, "needs_icu": False},
    {"name": "Meena Kumari", "lat": 21.4920, "lon": 86.9380, "severity": Severity.SEVERE, "conditions": ["trauma", "surgery"], "age": 26, "needs_icu": True},
    {"name": "Ashok Kumar", "lat": 20.4650, "lon": 85.8700, "severity": Severity.MILD, "conditions": ["general", "clinic"], "age": 35, "needs_icu": False},
]


def _vary(base: float, pct: float = 0.1) -> float:
    """Randomly vary a base number by ±pct."""
    return base * (1 + random.uniform(-pct, pct))


def generate_hospitals() -> list[Hospital]:
    """Create hospitals from real Odisha data with slight randomisation."""
    hospitals: list[Hospital] = []
    for tpl in _HOSPITAL_TEMPLATES:
        total = int(_vary(tpl["total_beds"], 0.05))
        avail = random.randint(int(total * 0.15), int(total * 0.65))
        icu_total = int(_vary(tpl["icu_beds"], 0.1))
        icu_avail = random.randint(0, icu_total)
        hospitals.append(
            Hospital(
                name=tpl["name"],
                lat=tpl["lat"] + random.uniform(-0.003, 0.003),
                lon=tpl["lon"] + random.uniform(-0.003, 0.003),
                total_beds=total,
                available_beds=avail,
                icu_beds=icu_total,
                icu_available=icu_avail,
                facilities=list(tpl["facilities"]),
                staff_level=tpl["staff_level"],
            )
        )
    return hospitals


def generate_victims() -> list[Victim]:
    """Create victims from real Odisha scenarios with slight coordinate jitter."""
    victims: list[Victim] = []
    for tpl in _VICTIM_TEMPLATES:
        victims.append(
            Victim(
                name=tpl["name"],
                lat=tpl["lat"] + random.uniform(-0.002, 0.002),
                lon=tpl["lon"] + random.uniform(-0.002, 0.002),
                severity=tpl["severity"],
                conditions=list(tpl["conditions"]),
                age=tpl["age"],
                needs_icu=tpl["needs_icu"],
            )
        )
    return victims
