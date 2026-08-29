# 🏥 Rakshak — Disaster Management System

A comprehensive disaster management platform for Odisha, India with smart hospital allocation, indoor emergency modeling, evacuation drills, and real-time crisis response.

## 🌟 Features

### Core Capabilities
- **Smart Hospital Allocation** — AI-powered victim-to-hospital assignment using multi-factor scoring (distance, capacity, ICU availability, facilities match, severity)
- **Indoor Emergency Model** — Simulate building evacuations with 2D floor plans, hazard zones, and evacuation routes
- **Evacuation Drill System** — Generate random drill scenarios, run real-time simulations, and generate post-drill reports
- **Undo/Redo** — Full action history with keyboard shortcuts (Ctrl+Z / Ctrl+Y)

### Real Data
- **14 Hospitals across Odisha** — AIIMS Bhubaneswar, SCB Cuttack, KIMS, SUM Hospital, and more
- **20 Victim Scenarios** — Indian names, real Odisha city coordinates, realistic conditions
- **OSM Routing** — Real road-network distances via OpenStreetMap/OSRM

### Security
- **JWT Authentication** — Secure login with role-based access control
- **Three User Roles:**
  - `admin` — Full access (CRUD, manage users, reset data)
  - `operator` — Manage hospitals, victims, run allocations
  - `viewer` — Read-only dashboard access

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd freebuff
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

5. **Login with default credentials**
   - Username: `admin`
   - Password: `admin123`

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd freebuff
   cp .env.example .env
   # Edit .env and set a secure SECRET_KEY
   ```

2. **Build and run**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop the application**
   ```bash
   docker-compose down
   ```

### Manual Docker Build

```bash
# Build backend
docker build -t disaster-mgmt-backend .

# Build frontend
cd frontend
docker build -t disaster-mgmt-frontend .

# Run
docker run -d -p 8000:8000 -e SECRET_KEY=your-secret disaster-mgmt-backend
docker run -d -p 80:80 disaster-mgmt-frontend
```

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |

### Hospitals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hospitals` | List all hospitals |
| GET | `/api/hospitals/{id}` | Get hospital details |
| POST | `/api/hospitals` | Create hospital |
| PUT | `/api/hospitals/{id}` | Update hospital |
| DELETE | `/api/hospitals/{id}` | Delete hospital |

### Victims
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/victims` | List all victims |
| GET | `/api/victims/unassigned` | List unassigned victims |
| POST | `/api/victims` | Create victim |
| PUT | `/api/victims/{id}` | Update victim |
| DELETE | `/api/victims/{id}` | Delete victim |

### Allocation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/allocate` | Allocate all victims to hospitals |
| POST | `/api/allocate/{victim_id}` | Allocate single victim |

### Buildings & Drills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/buildings` | List buildings |
| POST | `/api/buildings` | Create building with auto-generated layout |
| POST | `/api/drills` | Create evacuation drill |
| POST | `/api/drills/{id}/start` | Start drill simulation |
| POST | `/api/drills/{id}/tick` | Advance simulation |
| GET | `/api/drills/{id}/report` | Get drill report |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seed` | Seed demo data |
| GET | `/api/stats` | Dashboard statistics |
| GET | `/api/history` | Action history |
| POST | `/api/history/undo` | Undo last action |
| POST | `/api/history/redo` | Redo last undone action |

## 🏥 Hospitals in Odisha

| Hospital | City | Beds | ICU | Specialties |
|----------|------|------|-----|-------------|
| AIIMS Bhubaneswar | Bhubaneswar | 1500 | 150 | Trauma, Cardiac, Neurology, Burns |
| SCB Medical College | Cuttack | 1500 | 120 | Trauma, Emergency, Surgery |
| KIMS Hospital | Bhubaneswar | 2600 | 600 | Full specialty |
| SUM Hospital | Bhubaneswar | 1750 | 200 | Cardiac, Neurology, Pediatric |
| Capital Hospital | Bhubaneswar | 1000 | 80 | Trauma, Emergency |
| VSS Medical College | Sambalpur | 1000 | 80 | Trauma, Emergency |
| MKCG Medical College | Berhampur | 1000 | 70 | Trauma, Burns |

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SECRET_KEY` | (dev key) | JWT signing secret |
| `DATABASE_URL` | `sqlite+aiosqlite:///./disaster_management.db` | Database connection |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

### User Roles

| Role | Permissions |
|------|-------------|
| `admin` | Full access: CRUD all entities, manage users, reset data |
| `operator` | Manage hospitals, victims, run allocations, create drills |
| `viewer` | Read-only dashboard access |

## 📁 Project Structure

```
freebuff/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── auth.py              # JWT authentication
│   ├── models.py            # Pydantic models
│   ├── db_models.py         # SQLAlchemy models
│   ├── database.py          # Database operations
│   ├── db_session.py        # Session factory
│   ├── mock_data.py         # Odisha hospital/victim data
│   ├── scoring.py           # Allocation algorithm
│   ├── routing.py           # OSRM routing
│   ├── routers/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── hospitals.py     # Hospital CRUD
│   │   ├── victims.py       # Victim CRUD
│   │   ├── allocation.py    # Allocation logic
│   │   ├── buildings.py     # Indoor model
│   │   ├── drills.py        # Evacuation drills
│   │   └── history.py       # Undo/Redo
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application
│   │   ├── api.ts           # API client
│   │   ├── types.ts         # TypeScript types
│   │   └── components/
│   │       ├── AuthContext.tsx
│   │       ├── LoginPage.tsx
│   │       ├── Dashboard.tsx
│   │       ├── VictimList.tsx
│   │       ├── AllocationMap.tsx
│   │       ├── ResultCard.tsx
│   │       ├── ManageTab.tsx
│   │       ├── BuildingsTab.tsx
│   │       ├── DrillsTab.tsx
│   │       └── UndoRedo.tsx
│   ├── nginx.conf
│   └── Dockerfile
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** for map data
- **OSRM** for routing calculations
- **FastAPI** for the backend framework
- **React** for the frontend
- **Leaflet** for map visualization
