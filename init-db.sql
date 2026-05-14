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

-- Create schemas for each microservice
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS election;
CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS finance;

-- Grant schema permissions
GRANT ALL ON SCHEMA auth TO formula1;
GRANT ALL ON SCHEMA election TO formula1;
GRANT ALL ON SCHEMA content TO formula1;
GRANT ALL ON SCHEMA finance TO formula1;

-- Log initialization
SELECT 'Database initialized successfully' AS status;
