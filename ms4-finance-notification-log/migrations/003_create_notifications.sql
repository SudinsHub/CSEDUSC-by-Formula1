-- MS4 Notifications Table Migration
-- Creates table for storing in-app notifications and broadcast actions

CREATE TABLE IF NOT EXISTS finance.notifications (
  notification_id   SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL,  -- Cross-schema reference to auth.users.user_id
  title             VARCHAR(255) NOT NULL,
  message           TEXT NOT NULL,
  type              VARCHAR(50) NOT NULL,  -- 'contact_submission', 'pending_approval', 'custom', 'system', 'budget_update'
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  details           JSONB,  -- Extra metadata like { name, email, original_msg, etc. }
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON finance.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON finance.notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON finance.notifications(created_at DESC);

COMMENT ON TABLE finance.notifications IS 'Stores in-app notifications for club members';
COMMENT ON COLUMN finance.notifications.details IS 'JSONB payload for flexible extra metadata';
