# SecureWatch — Security Intelligence Dashboard

## Overview

Full-stack security intelligence platform with four core modules:
1. **Speech Emotion Recognition (SER)** — ML-based emotion detection from audio (stressed, drunk, abusive, pain, neutral)
2. **Login Attempt Visualization** — Real-time dashboard tracking login history with IP geolocation and charts
3. **AI Anomaly Detection** — Behavioral analysis engine detecting unusual login patterns
4. **Blockchain Audit Log** — Immutable SHA-256 chained ledger for security events

## Demo Credentials
- `admin / admin123` (admin role)
- `operator / operator123` (operator role)
- `alice / alice123` (viewer role)

## Stack

- **Frontend**: React + Vite + TailwindCSS (artifacts/security-dashboard)
- **Backend**: Node.js + Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (HS256, 24hr expiry)
- **Charts**: Recharts
- **ML**: TensorFlow.js-style simulation (emotionDetector.ts), rule-based anomaly detection (anomalyDetector.ts)
- **Blockchain**: Custom SHA-256 blockchain with proof-of-work (blockchain.ts)
- **Monorepo**: pnpm workspaces
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts/
├── api-server/                  # Express API backend
│   └── src/
│       ├── lib/
│       │   ├── auth.ts          # JWT auth utilities
│       │   ├── blockchain.ts    # Blockchain implementation (SHA-256 proof-of-work)
│       │   ├── emotionDetector.ts # SER engine (simulates TensorFlow.js inference)
│       │   └── anomalyDetector.ts # AI anomaly detection (ML heuristics)
│       └── routes/
│           ├── auth.ts          # POST /api/auth/login, /logout, GET /me
│           ├── loginAttempts.ts # GET/POST /api/login-attempts, GET /stats
│           ├── emotions.ts      # POST /api/emotions/analyze, GET /calls
│           ├── anomalies.ts     # GET /api/anomalies, POST /analyze
│           └── blockchain.ts    # GET /api/blockchain/logs, /verify, POST /add
├── security-dashboard/          # React frontend
│   └── src/
│       ├── pages/
│       │   ├── login.tsx        # Login screen
│       │   ├── dashboard.tsx    # Overview dashboard
│       │   ├── emotions.tsx     # SER module
│       │   ├── logins.tsx       # Login attempts visualization
│       │   ├── anomalies.tsx    # Anomaly detection feed
│       │   └── blockchain.tsx   # Blockchain audit log viewer
│       └── hooks/
│           └── use-auth.tsx     # Auth context + JWT management
lib/
├── api-spec/openapi.yaml        # OpenAPI 3.1 spec (source of truth)
├── api-client-react/            # Generated React Query hooks
├── api-zod/                     # Generated Zod validators
└── db/src/schema/               # Drizzle ORM schemas
    ├── users.ts
    ├── loginAttempts.ts
    ├── emotionCalls.ts
    ├── anomalies.ts
    └── blockchainBlocks.ts
scripts/src/seed.ts              # Database seed script
```

## Running Commands

```bash
# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/security-dashboard run dev

# Seed database
pnpm --filter @workspace/scripts run seed

# Push DB schema
pnpm --filter @workspace/db run push

# Run codegen (after OpenAPI spec changes)
pnpm --filter @workspace/api-spec run codegen
```

## Key Technical Details

### Blockchain
- Custom SHA-256 proof-of-work blockchain (`lib/blockchain.ts`)
- Difficulty: 2 leading zeros required per block hash
- Genesis block auto-created on first request
- Lazy-loaded from PostgreSQL on startup
- Tamper detection via hash chain validation

### SER (Speech Emotion Recognition)
- Simulates ML pipeline: feature extraction → model inference → risk scoring
- In production: replace with TensorFlow.js model or Python FastAPI microservice
- Emotions: stressed, drunk, abusive, pain, neutral
- Risk levels: low, medium, high, critical
- Auto-escalation at critical risk

### Anomaly Detection
- Rule-based engine simulating ML (Isolation Forest / LSTM approach)
- Factors: unusual_location, unusual_time, new_device, high_frequency, brute_force, vpn_detected
- Recommendations: allow / monitor / challenge / block
- Risk score: 0–100 aggregated from factor weights

### JWT Auth
- HS256 algorithm, 24-hour expiry
- Custom implementation (no external JWT library)
- Token sent as `Authorization: Bearer <token>` header
