-- Create election schema
CREATE SCHEMA IF NOT EXISTS election;

-- Elections table
CREATE TABLE IF NOT EXISTS election.elections (
    election_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    phase SMALLINT NOT NULL CHECK (phase IN (1, 2)),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'closed')),
    rules TEXT,
    max_votes_per_user SMALLINT NOT NULL DEFAULT 1,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Candidates table
CREATE TABLE IF NOT EXISTS election.candidates (
    candidate_id SERIAL PRIMARY KEY,
    election_id INTEGER NOT NULL REFERENCES election.elections(election_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    bio TEXT,
    post VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(election_id, user_id)
);

-- Votes table (anonymous - no voter_user_id)
CREATE TABLE IF NOT EXISTS election.votes (
    vote_id SERIAL PRIMARY KEY,
    election_id INTEGER NOT NULL REFERENCES election.elections(election_id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES election.candidates(candidate_id) ON DELETE CASCADE,
    cast_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vote cast log table (who voted - no candidate_id)
CREATE TABLE IF NOT EXISTS election.vote_cast_log (
    log_id SERIAL PRIMARY KEY,
    election_id INTEGER NOT NULL REFERENCES election.elections(election_id) ON DELETE CASCADE,
    voter_user_id INTEGER NOT NULL,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(election_id, voter_user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_elections_status ON election.elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_time ON election.elections(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_candidates_election ON election.candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election ON election.votes(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON election.votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_vote_cast_log_election_user ON election.vote_cast_log(election_id, voter_user_id);
