-- ============================================================
--  Personal Task Manager — Database Migration
--  Run this script once against your PostgreSQL database.
--  Example: psql $DATABASE_URL -f migration.sql
-- ============================================================

-- Enable pgcrypto if you later want UUID primary keys; skip for now.
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── tasks table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL        PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL CHECK (char_length(trim(title)) > 0),
  description TEXT,
  completed   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Index: list tasks newest-first (created_at DESC) ─────────
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at DESC);

-- ── Index: quickly filter by completion status ────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_completed  ON tasks (completed);

-- ── Auto-update updated_at on every row change ────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ── Seed a couple of example rows (remove in production) ──────
-- INSERT INTO tasks (title, description)
-- VALUES
--   ('Buy groceries', 'Milk, eggs, bread, coffee'),
--   ('Read a book',   NULL);

