-- Staging-only auth session storage. Does not modify member records.
CREATE TABLE IF NOT EXISTS worker_auth_sessions (
  token_hash TEXT PRIMARY KEY,
  member_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(member_id) REFERENCES kyc_members(id)
);
CREATE INDEX IF NOT EXISTS idx_worker_auth_sessions_expiry ON worker_auth_sessions(expires_at);
CREATE TABLE IF NOT EXISTS worker_login_attempts (
  attempt_key TEXT PRIMARY KEY,
  failures INTEGER NOT NULL DEFAULT 0,
  window_ends INTEGER NOT NULL
);
