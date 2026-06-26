-- Migration: Create transactions table in finance schema
SET search_path TO finance, public;

CREATE TABLE IF NOT EXISTS finance.transactions (
    transaction_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100) UNIQUE,
    purpose VARCHAR(100) NOT NULL, -- e.g. 'event_registration'
    target_id INTEGER NOT NULL, -- e.g. registration_id (from content.event_registrations)
    payment_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON finance.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON finance.transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_transactions_purpose_target ON finance.transactions(purpose, target_id);
