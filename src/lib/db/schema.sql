-- Run this in Supabase SQL editor to create all tables

CREATE TABLE IF NOT EXISTS users (
  user_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint_hash  TEXT UNIQUE NOT NULL,
  local_storage_id  TEXT,
  ip_address        TEXT,
  user_agent        TEXT,
  screen_resolution TEXT,
  timezone          TEXT,
  platform          TEXT,
  language          TEXT,
  first_seen_at     TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at      TIMESTAMPTZ DEFAULT NOW(),
  visit_count       INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id           TEXT PRIMARY KEY,
  user_id              UUID REFERENCES users(user_id),
  started_at           TIMESTAMPTZ DEFAULT NOW(),
  completed_at         TIMESTAMPTZ,
  report_types_uploaded TEXT[],
  account_name         TEXT,
  date_range_start     DATE,
  date_range_end       DATE,
  currency             TEXT
);

CREATE TABLE IF NOT EXISTS audit_results (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         TEXT REFERENCES sessions(session_id),
  user_id            UUID REFERENCES users(user_id),
  health_score       INTEGER,
  acos               NUMERIC(6,4),
  roas               NUMERIC(8,4),
  tacos              NUMERIC(6,4),
  ad_spend           NUMERIC(12,2),
  ad_sales           NUMERIC(12,2),
  total_store_sales  NUMERIC(12,2),
  organic_sales      NUMERIC(12,2),
  currency           TEXT,
  sessions_count     INTEGER,
  clicks             INTEGER,
  orders             INTEGER,
  cpc                NUMERIC(8,4),
  buy_box_pct        NUMERIC(5,2),
  campaign_count     INTEGER,
  waste_spend        NUMERIC(12,2),
  waste_term_count   INTEGER,
  confidence_score   NUMERIC(4,2),
  invariant_passed   BOOLEAN,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS engine_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     TEXT REFERENCES sessions(session_id),
  user_id        UUID REFERENCES users(user_id),
  task_type      TEXT NOT NULL,
  model_used     TEXT NOT NULL,
  fallback_used  BOOLEAN DEFAULT FALSE,
  confidence     NUMERIC(3,2),
  warnings       TEXT[],
  duration_ms    INTEGER,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user 
  ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_session 
  ON audit_results(session_id);
CREATE INDEX IF NOT EXISTS idx_engine_logs_session 
  ON engine_logs(session_id);

-- Product feedback (audit dashboard widget)
CREATE TABLE IF NOT EXISTS feedback (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        TEXT,
  user_id           UUID REFERENCES users(user_id),
  section           TEXT NOT NULL,
  type              TEXT NOT NULL,
  description       TEXT,
  include_session   BOOLEAN DEFAULT FALSE,
  metrics_snapshot  JSONB,
  page_url          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);

-- Safely increments visit_count without race conditions
CREATE OR REPLACE FUNCTION increment_visit_count()
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT visit_count FROM users 
     WHERE fingerprint_hash = fingerprint_hash LIMIT 1), 0
  ) + 1
$$ LANGUAGE sql;

