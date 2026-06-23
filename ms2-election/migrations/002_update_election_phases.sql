-- Update election schema for phase 1 & 2 support

-- Add columns to elections table
ALTER TABLE election.elections ADD COLUMN IF NOT EXISTS batch_start_year INTEGER;
ALTER TABLE election.elections ADD COLUMN IF NOT EXISTS batch_end_year INTEGER;
ALTER TABLE election.elections ADD COLUMN IF NOT EXISTS representatives_per_batch INTEGER DEFAULT 5;
ALTER TABLE election.elections ADD COLUMN IF NOT EXISTS designations JSONB DEFAULT '[]'::jsonb;

-- Add columns to candidates table
ALTER TABLE election.candidates ADD COLUMN IF NOT EXISTS phase SMALLINT NOT NULL DEFAULT 1 CHECK (phase IN (1, 2));
ALTER TABLE election.candidates ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE election.candidates ADD COLUMN IF NOT EXISTS is_elected BOOLEAN NOT NULL DEFAULT FALSE;

-- Update candidates unique constraint to include phase
ALTER TABLE election.candidates DROP CONSTRAINT IF EXISTS candidates_election_id_user_id_key;
ALTER TABLE election.candidates DROP CONSTRAINT IF EXISTS candidates_election_id_user_id_phase_key;
ALTER TABLE election.candidates ADD CONSTRAINT candidates_election_id_user_id_phase_key UNIQUE(election_id, user_id, phase);

-- Add phase column to votes table
ALTER TABLE election.votes ADD COLUMN IF NOT EXISTS phase SMALLINT NOT NULL DEFAULT 1 CHECK (phase IN (1, 2));

-- Add phase column to vote_cast_log table
ALTER TABLE election.vote_cast_log ADD COLUMN IF NOT EXISTS phase SMALLINT NOT NULL DEFAULT 1 CHECK (phase IN (1, 2));

-- Update vote_cast_log unique constraint to include phase
ALTER TABLE election.vote_cast_log DROP CONSTRAINT IF EXISTS vote_cast_log_election_id_voter_user_id_key;
ALTER TABLE election.vote_cast_log DROP CONSTRAINT IF EXISTS vote_cast_log_election_id_voter_user_id_phase_key;
ALTER TABLE election.vote_cast_log ADD CONSTRAINT vote_cast_log_election_id_voter_user_id_phase_key UNIQUE(election_id, voter_user_id, phase);
