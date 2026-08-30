# FloodLens — Deployment & Operations Guide

## Production Hardening, System Reliability & Operations Manual

This guide documents the local and containerized production-style deployment procedure for FloodLens, covering environment setup, Docker Compose orchestration, volume persistence, database management, backup/restore procedures, health monitoring, and scientific model guardrails.

---

## 1. Prerequisites

- **Docker Engine**: v20.10.0+
- **Docker Compose**: v2.0.0+
- **Python**: v3.9+ or v3.11+ (for non-containerized local execution)
- **Node.js**: v18.0.0+ (for frontend non-containerized local development)

---

## 2. Environment Configuration

FloodLens uses environment variables for operational configuration. Standard defaults are supplied in `.env.example`.

Create a local `.env` file from the template:

```bash
cp .env.example .env
```

### Supported Settings

| Variable | Default | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `development` | Environment indicator (`development`, `production`, `testing`) |
| `DATABASE_URL` | `sqlite:///./data/floodlens.db` | SQLAlchemy database URI |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:80` | Comma-separated allowed HTTP origins |
| `HOST` | `0.0.0.0` | API bind host address |
| `PORT` | `8000` | API bind port |
| `LOG_LEVEL` | `INFO` | Python logging severity level (`DEBUG`, `INFO`, `WARNING`, `ERROR`) |

---

## 3. Containerized Production Deployment (Recommended)

### Step 3.1: Build and Launch Services

Launch the full-stack container environment (FastAPI backend + React/Nginx frontend) in detached mode:

```bash
docker compose build
docker compose up -d
```

### Step 3.2: Verify Service Status

Check that all containers are healthy:

```bash
docker compose ps
```

Expected output:
- `floodlens-backend`: Up (healthy) on port `8000`
- `floodlens-frontend`: Up (healthy) on port `80`

### Step 3.3: Container Logs

Monitor application logs:

```bash
docker compose logs -f
```

---

## 4. Non-Containerized Local Development

### Step 4.1: Backend Setup

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database schema and canonical seed data
python scripts/init_db.py

# Start FastAPI Uvicorn dev server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4.2: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs at `http://localhost:5173`.

---

## 5. Database & Volume Persistence

FloodLens uses SQLite with SQLAlchemy ORM. All persistent state is isolated under the `./data` directory:

- `./data/floodlens.db`: Relational tables (`study_areas`, `scenarios`, `simulations`, `simulation_results`, `result_artifacts`).
- `./data/results/`: Inundation GeoJSON extents, vector layers, exposure summaries, and metadata.
- `./data/processed/`: Input DEM raster (`dem.tif`), village points (`villages.geojson`), and road networks (`roads.geojson`).

In `docker-compose.yml`, the host `./data` directory is bind-mounted to `/app/data` inside the container:

```yaml
volumes:
  - ./data:/app/data
```

This guarantees that database records and GIS simulation result artifacts persist intact across `docker compose down` and `docker compose up` lifecycle events.

---

## 6. System Health & Readiness Probes

The backend exposes health and readiness probes for monitoring and container orchestration:

### 6.1 Liveness Probe

```bash
curl -i http://localhost:8000/health
```

Response (HTTP 200):
```json
{
  "status": "ok",
  "service": "FloodLens API Engine",
  "database": "ok",
  "environment": "production",
  "version": "1.0.0",
  "timestamp": "2026-08-29T16:40:00Z",
  "phase": "Phase 9 — Production Hardening & System Reliability Active"
}
```

### 6.2 Readiness Probe

```bash
curl -i http://localhost:8000/ready
```

Response (HTTP 200 when database connected, or HTTP 530/503 when degraded):
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-08-29T16:40:00Z"
}
```

---

## 7. Data Backup & Restore Utility

FloodLens includes an automated local backup script to archive database records and simulation artifacts into a timestamped `.tar.gz` archive.

### 7.1 Create Backup Snapshot

```bash
python scripts/backup_data.py
```

Output archive created at: `data/backups/floodlens_backup_YYYYMMDD_HHMMSS.tar.gz`

### 7.2 Restore Backup Snapshot

```bash
python scripts/backup_data.py --restore data/backups/floodlens_backup_20260829_164000.tar.gz
```

---

## 8. Error Handling & Request Tracing

All API responses include a unique request identifier in the `X-Request-ID` header.

Errors follow a structured JSON schema:

```json
{
  "detail": "Simulation 'sim-xyz' not found.",
  "error": {
    "code": "NOT_FOUND",
    "message": "Simulation 'sim-xyz' not found.",
    "request_id": "req-94dfc9a7"
  }
}
```

---

## 9. Automated Testing & Verification

Run the full automated backend test suite:

```bash
./venv/bin/python -m unittest discover -s tests
```

Build the production frontend React bundle:

```bash
cd frontend && npm run build
```

---

## 10. Scientific Model Disclaimer & Guardrails

> [!IMPORTANT]
> **Scientific Disclaimer**: FloodLens outputs are generated using a native Level 1 2D diffusive-wave hydrodynamic solver designed for rapid screening and decision-support. Output data and warnings are scenario-based estimations and must **NOT** be used as official disaster warnings, certified hydraulic engineering models, or real-time flood predictions.
