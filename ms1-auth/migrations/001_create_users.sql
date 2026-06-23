-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Set search path to auth for this migration
SET search_path TO auth, public;

-- Idempotent type creation for user_role
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('GeneralStudent', 'ECMember', 'Administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Idempotent type creation for user_status
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
  user_id         SERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'GeneralStudent',
  status          user_status NOT NULL DEFAULT 'PENDING',
  registration_no VARCHAR(50),
  batch_year      INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

