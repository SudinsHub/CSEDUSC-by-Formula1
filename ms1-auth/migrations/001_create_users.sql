CREATE TYPE user_role AS ENUM ('GeneralStudent', 'ECMember', 'Administrator');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'REVOKED');

CREATE TABLE users (
  user_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE password_reset_tokens (
  token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
