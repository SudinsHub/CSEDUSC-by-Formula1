# MS2 - Election Service

**Owner:** Syed Naimul Islam  
**Port:** 3002  
**Database Schema:** election

## Overview

MS2 is the most critical microservice in the CSEDU Club Management System. It manages the complete election lifecycle including:

- Election creation and scheduling
- Candidate registration
- Concurrency-safe voting with atomicity guarantees
- Result concealment until election closes
- Automatic election open/close via BullMQ delayed jobs

## Key Features

### Vote Atomicity (Critical Algorithm)
The voting implementation uses PostgreSQL transactions with `SELECT FOR UPDATE` to guarantee:
- Exactly-once vote recording
- No duplicate votes from the same user
- Full ACID compliance under concurrent load

### Vote Anonymity
- `votes` table stores WHAT was voted (no voter_user_id)
- `vote_cast_log` table stores WHO voted (no candidate_id)
- No single query can reconstruct voter-to-candidate mapping

### Result Concealment
Results endpoint returns 403 Forbidden until election status = 'closed', preventing bandwagon effects.

### Auto-Scheduling
Elections automatically transition from 'scheduled' → 'active' → 'closed' based on start_time and end_time using BullMQ delayed jobs that survive service restarts.

## API Endpoints

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /elections | Yes | Admin | Create election |
| GET | /elections | No | - | List all elections |
| GET | /elections/:id | No | - | Get election details |
| PATCH | /elections/:id | Yes | Admin | Update election |
| POST | /elections/:id/candidates | Yes | Admin | Add candidate |
| GET | /elections/:id/candidates | Yes | Student+ | List candidates |
| POST | /elections/:id/vote | Yes | Student | Cast vote |
| GET | /elections/:id/results | Yes | Any | Get results (after close) |

## Environment Variables

```env
PORT=3002
DATABASE_URL=postgres://ms2user:password@localhost:5432/cseduclub
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

## Database Schema

See `migrations/001_create_election_schema.sql` for complete schema definition.

### Tables
- `election.elections` - Election metadata
- `election.candidates` - Candidate profiles
- `election.votes` - Anonymous votes (what)
- `election.vote_cast_log` - Voter tracking (who)

## Running Locally

```bash
npm install
npm start
```

## Integration

This service integrates with:
- **API Gateway** - Receives JWT-verified requests with X-User-Id and X-User-Role headers
- **MS1 (Auth)** - Cross-schema reads on auth.users for candidate info
- **MS4 (Finance/Notify/Log)** - Emits events to BullMQ queues (audit, notifications)

## Architecture Notes

- Stateless service - can be horizontally scaled
- Uses connection pooling for PostgreSQL
- BullMQ worker runs in same process as HTTP server
- All async events are fire-and-forget (outside transaction)
