-- ============================================================
-- DRIS — Database schema (PostgreSQL / Neon)
-- Run with: npm run db:migrate  (idempotent — safe to re-run)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('Technologist','Supervisor','Manager','Operations');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE equip_kind AS ENUM ('Portable','Room');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE equip_status AS ENUM ('Available','In Use','Reserved','Maintenance','Offline');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ticket_priority AS ENUM ('Low','Medium','High','Critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE ticket_status AS ENUM ('Open','In Progress','With Biomedical','Closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------- Users ----------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'Technologist',
  department    TEXT NOT NULL DEFAULT '',
  badge         TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  shift         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Equipment ----------
CREATE TABLE IF NOT EXISTS equipment (
  id              TEXT PRIMARY KEY,
  tag             TEXT NOT NULL,
  name            TEXT NOT NULL,
  kind            equip_kind NOT NULL,
  model           TEXT NOT NULL DEFAULT '',
  serial          TEXT NOT NULL DEFAULT '',
  status          equip_status NOT NULL DEFAULT 'Available',
  current_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department      TEXT NOT NULL DEFAULT '',
  last_inspection DATE,
  next_ppm        DATE,
  next_qc         DATE,
  battery         INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Inspections (answers = JSONB array of booleans) ----------
CREATE TABLE IF NOT EXISTS inspections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id   TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  inspector_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  answers        JSONB NOT NULL,
  comment        TEXT NOT NULL DEFAULT '',
  flagged        BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inspections_equipment ON inspections(equipment_id);
CREATE INDEX IF NOT EXISTS idx_inspections_created   ON inspections(created_at DESC);

-- ---------- Tickets ----------
CREATE TABLE IF NOT EXISTS tickets (
  id           TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  problem      TEXT NOT NULL,
  priority     ticket_priority NOT NULL DEFAULT 'Medium',
  status       ticket_status NOT NULL DEFAULT 'Open',
  description  TEXT NOT NULL DEFAULT '',
  created_by   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_ticket ON ticket_comments(ticket_id);

-- ---------- NFC sessions: one active session per user ----------
CREATE TABLE IF NOT EXISTS sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id TEXT NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name    TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at     TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_session_per_user
  ON sessions(user_id) WHERE ended_at IS NULL;

-- ---------- Activity feed ----------
CREATE TABLE IF NOT EXISTS activity (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  who        TEXT NOT NULL,
  what       TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
