-- MS4 Finance Schema Migration
-- Creates tables for budget management, expenditure tracking, and activity logging

CREATE SCHEMA IF NOT EXISTS finance;

-- ══════════════════════════════════════════════════════════════════════════════
-- Table: finance.budgets
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance.budgets (
  budget_id       SERIAL PRIMARY KEY,
  event_id        INTEGER,  -- Cross-schema reference to content.events.event_id
  proposed_by     INTEGER NOT NULL,  -- Cross-schema reference to auth.users.user_id
  status          VARCHAR(20) NOT NULL DEFAULT 'pending_review',  -- pending_review, approved, rejected
  total_amount    NUMERIC(12, 2) NOT NULL,
  line_items      JSONB NOT NULL,  -- Array of {category, estimatedCost} objects
  admin_comment   TEXT,
  reviewed_by     INTEGER,  -- Cross-schema reference to auth.users.user_id
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  
  CONSTRAINT budgets_status_check CHECK (status IN ('pending_review', 'approved', 'rejected')),
  CONSTRAINT budgets_total_amount_check CHECK (total_amount >= 0)
);

CREATE INDEX idx_budgets_event_id ON finance.budgets(event_id);
CREATE INDEX idx_budgets_proposed_by ON finance.budgets(proposed_by);
CREATE INDEX idx_budgets_status ON finance.budgets(status);
CREATE INDEX idx_budgets_submitted_at ON finance.budgets(submitted_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- Table: finance.expenditures
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance.expenditures (
  expenditure_id  SERIAL PRIMARY KEY,
  budget_id       INTEGER NOT NULL REFERENCES finance.budgets(budget_id) ON DELETE CASCADE,
  category        VARCHAR(100) NOT NULL,
  amount          NUMERIC(12, 2) NOT NULL,
  description     TEXT NOT NULL,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recorded_by     INTEGER NOT NULL,  -- Cross-schema reference to auth.users.user_id
  
  CONSTRAINT expenditures_amount_check CHECK (amount >= 0)
);

CREATE INDEX idx_expenditures_budget_id ON finance.expenditures(budget_id);
CREATE INDEX idx_expenditures_recorded_at ON finance.expenditures(recorded_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- Table: finance.activity_logs
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS finance.activity_logs (
  log_id            SERIAL PRIMARY KEY,
  actor_user_id     INTEGER,  -- Cross-schema reference to auth.users.user_id (nullable for system actions)
  action_type       VARCHAR(80) NOT NULL,  -- e.g., user.approved, election.created, budget.decided
  target_entity     VARCHAR(60) NOT NULL,  -- e.g., user, election, budget, event
  target_entity_id  INTEGER,  -- ID of the affected record
  details           JSONB,  -- Additional metadata
  logged_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_actor_user_id ON finance.activity_logs(actor_user_id);
CREATE INDEX idx_activity_logs_action_type ON finance.activity_logs(action_type);
CREATE INDEX idx_activity_logs_target_entity ON finance.activity_logs(target_entity);
CREATE INDEX idx_activity_logs_logged_at ON finance.activity_logs(logged_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- Comments
-- ══════════════════════════════════════════════════════════════════════════════
COMMENT ON TABLE finance.budgets IS 'Budget proposals submitted by EC members for events';
COMMENT ON TABLE finance.expenditures IS 'Actual expenditures recorded against approved budgets';
COMMENT ON TABLE finance.activity_logs IS 'Append-only audit trail of all system actions';

COMMENT ON COLUMN finance.budgets.line_items IS 'JSONB array of budget line items with category and estimatedCost';
COMMENT ON COLUMN finance.activity_logs.details IS 'JSONB object containing additional context for the action';
