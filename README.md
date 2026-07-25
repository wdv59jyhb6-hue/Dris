# DRIS — Daily Radiology Inspection & Equipment Management System

> **Improve Safety. Ensure Readiness.**

A production-ready web application for the Ministry of National Guard Health Affairs (MNGHA) Radiology Department. Manages portable and fixed X-Ray equipment, daily inspection checklists, NFC session control, and maintenance ticket escalation.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Recharts, IBM Plex fonts |
| Backend | Vercel Serverless Functions (Node 20) |
| Database | Neon Postgres (serverless) |
| Auth | Custom JWT (bcrypt + jsonwebtoken) |
| Deploy | Vercel (frontend + API), custom `.com` domain |

---

## Project structure

```
dris/
├── api/                  # Serverless API functions (deployed by Vercel)
│   ├── _lib.js           # DB client, JWT auth, role permissions (Part 2 fix)
│   ├── auth/
│   │   ├── login.js      # POST /api/auth/login
│   │   └── me.js         # GET  /api/auth/me
│   ├── equipment/
│   │   └── index.js      # GET  /api/equipment
│   ├── inspections/
│   │   └── index.js      # GET (role-scoped) / POST /api/inspections
│   ├── tickets/
│   │   ├── index.js      # GET / POST /api/tickets
│   │   └── comment.js    # POST /api/tickets/comment
│   ├── sessions/
│   │   └── index.js      # GET / POST / DELETE /api/sessions
│   ├── activity/
│   │   └── index.js      # GET /api/activity
│   └── users/
│       └── index.js      # GET /api/users  (Manager+ only)
├── db/
│   └── schema.sql        # Postgres schema (idempotent)
├── scripts/
│   ├── migrate.js        # npm run db:migrate
│   └── seed.js           # npm run db:seed
├── src/
│   ├── App.jsx           # Complete React application (1 300+ lines)
│   ├── api.js            # Frontend fetch wrapper
│   ├── index.css         # Tailwind + animation keyframes
│   └── main.jsx          # React entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json           # Vercel deployment config
├── package.json
├── .env.example          # Copy to .env and fill in
└── .gitignore
```

---

## Quick start (local development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — add your Neon DATABASE_URL and a JWT_SECRET

# 3. Create tables and seed demo data
npm run db:migrate
npm run db:seed

# 4. Run locally (opens on http://localhost:5173)
npx vercel dev
```

---

## Demo accounts

All accounts use password **`dris2026`** after seeding.

| Username | Role |
|---|---|
| `omar.harbi` | Technologist |
| `nadiyah.otaibi` | Technologist |
| `faisal.zahrani` | Technologist |
| `hadeel.qahtani` | Supervisor |
| `mohammed.aqeeli` | Supervisor |
| `khalid.enezi` | Manager |
| `sara.dosari` | Operations |

---

## Role permissions

| Action | Technologist | Supervisor | Manager | Operations |
|---|:---:|:---:|:---:|:---:|
| View equipment | ✓ | ✓ | ✓ | ✓ |
| Start / end NFC session | ✓ | ✓ | ✓ | ✓ |
| Submit daily inspection | ✓ | ✓ | ✓ | ✓ |
| View own inspection reports | ✓ | ✓ | ✓ | ✓ |
| **View ALL inspection reports** | — | **✓** | **✓** | **✓** |
| Create maintenance ticket | — | ✓ | ✓ | ✓ |
| Add ticket comments | — | ✓ | ✓ | ✓ |
| View reports / analytics | — | ✓ | ✓ | ✓ |
| Manage users | — | — | ✓ | ✓ |
| Global / multi-hospital view | — | — | — | ✓ |

---

## Part 2 fix — Supervisor inspection visibility

The root of the bug: inspection queries were filtered to `inspector_id = current_user` regardless of role, so supervisors could only see their own submissions.

**Fix location: `api/_lib.js` — `inspectionScope()` function**

```js
export function inspectionScope(user) {
  if (atLeast(user.role, 'Supervisor')) return { all: true };   // sees everyone
  return { all: false, inspectorId: user.id };                  // own only
}
```

This is consumed in `api/inspections/index.js`:

```js
const scope = inspectionScope(user);
const rows = scope.all
  ? await sql`SELECT * FROM inspections ORDER BY created_at DESC`
  : await sql`SELECT * FROM inspections WHERE inspector_id = ${scope.inspectorId} ...`;
```

---

## NFC session rules

- One active session per user — enforced by a **Postgres partial unique index** (`one_active_session_per_user WHERE ended_at IS NULL`), so the constraint holds even under race conditions.
- 60-second activation window shown as a live countdown ring in the UI.
- Session capsule persists in the top bar on every page.

---

## Deployment

See **`DEPLOYMENT_GUIDE.md`** for a complete beginner-friendly step-by-step guide.

---

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `JWT_SECRET` | Long random secret for signing tokens |
| `SEED_PASSWORD` | Password used by `npm run db:seed` (default: `dris2026`) |

---

## Licence

Internal use — Ministry of National Guard Health Affairs, Radiology Department.
