-- Initialize databases for CSEDU Students' Club Management System
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create main database (already created by POSTGRES_DB env var)
-- CREATE DATABASE csedu_sc;

-- Connect to the database
\c csedu_sc;

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: Individual microservices will run their own migrations
-- This file is just for initial database setup

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE csedu_sc TO formula1;

-- Create schemas for each microservice (optional, for better organization)
CREATE SCHEMA IF NOT EXISTS ms1_auth;
CREATE SCHEMA IF NOT EXISTS ms2_election;
CREATE SCHEMA IF NOT EXISTS ms3_content;
CREATE SCHEMA IF NOT EXISTS ms4_finance;

-- Grant schema permissions
GRANT ALL ON SCHEMA ms1_auth TO formula1;
GRANT ALL ON SCHEMA ms2_election TO formula1;
GRANT ALL ON SCHEMA ms3_content TO formula1;
GRANT ALL ON SCHEMA ms4_finance TO formula1;

-- Log initialization
SELECT 'Database initialized successfully' AS status;
