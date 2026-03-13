# SecureWatch — Security Intelligence Dashboard

A full-stack security platform featuring Speech Emotion Recognition, Login Attempt Visualization, AI-Based Anomaly Detection, and Blockchain Audit Logs.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + TailwindCSS |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT |
| Blockchain | Custom SHA-256 proof-of-work |

---

## Local Setup (VS Code)

### Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **pnpm** — `npm install -g pnpm`
- **PostgreSQL 14+** — [postgresql.org/download](https://www.postgresql.org/download/)

---

### 1. Clone and install dependencies

```bash
git clone https://github.com/harshiniii-20/your-repo.git securewatch
cd securewatch
pnpm install
```

---

### 2. Set up the database

Create a local Postgres database:

```bash
createdb securewatch
# or via psql:
psql -U postgres -c "CREATE DATABASE securewatch;"
```

---

### 3. Configure environment variables

**Backend** (`artifacts/api-server/.env`):

```env
PORT=3001
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/securewatch
JWT_SECRET=any-long-random-string-here
```

**Frontend** (`artifacts/security-dashboard/.env`):

```env
# Optional — defaults are fine for local dev
# PORT=5173
# API_PORT=3001
```

---

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

---

### 5. Seed demo data

```bash
pnpm --filter @workspace/api-server run seed
```

This creates:
- 150 login attempts with geolocation data  
- 25 anomaly events  
- 12 voice call sessions  
- 9 blockchain blocks

---

### 6. Run the app

Open **two terminals** in VS Code:

**Terminal 1 — Backend:**
```bash
pnpm --filter @workspace/api-server run dev
# API running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/security-dashboard run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Operator | `operator` | `operator123` |
| Viewer | `alice` | `alice123` |

---

## Project Structure

```
securewatch/
├── artifacts/
│   ├── api-server/          # Express backend
│   │   └── src/
│   │       ├── lib/         # blockchain, SER, anomaly detector
│   │       └── routes/      # all API endpoints
│   └── security-dashboard/  # React frontend
│       └── src/
│           └── pages/       # Dashboard, Emotions, Logins, Anomalies, Blockchain
├── lib/
│   ├── db/                  # Drizzle schema + migrations
│   └── api-spec/            # OpenAPI spec
└── pnpm-workspace.yaml
```

---

## API Endpoints

All routes require `Authorization: Bearer <token>` (except `/api/auth/login`).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → returns JWT |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/logins` | Login attempt history |
| GET | `/api/anomalies` | Detected anomalies |
| GET | `/api/emotions/sessions` | Voice call sessions |
| POST | `/api/emotions/analyze` | Analyze audio segment |
| GET | `/api/blockchain/blocks` | Blockchain audit log |
| GET | `/api/blockchain/validate` | Validate chain integrity |
| GET | `/api/healthz` | Health check |
