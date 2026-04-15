  # MS2 Election Service - Integration Guide

## API Gateway Integration

The API Gateway is already configured to route election requests to MS2:

### Routes
- `GET /api/elections` → MS2 (public, no auth)
- `GET /api/elections/*` → MS2 (public, no auth)
- `POST /api/elections/*` → MS2 (protected, JWT + vote rate limiter)
- `PATCH /api/elections/*` → MS2 (protected, JWT)

### Headers Injected by Gateway
The gateway injects these headers after JWT verification:
- `x-user-id` - The authenticated user's ID
- `x-user-role` - The user's role (student, ec_member, admin)

MS2 trusts these headers unconditionally (no re-verification needed).

## MS1 (Auth) Integration

MS2 performs cross-schema reads on `auth.users` table for:
- Candidate information (name, email, batch_year)
- User validation

Example query in `candidateRepository.js`:
```sql
SELECT c.*, u.name, u.email, u.batch_year
FROM election.candidates c
LEFT JOIN auth.users u ON c.user_id = u.user_id
WHERE c.election_id = $1
```

## MS4 (Finance/Notify/Log) Integration

MS2 emits events to BullMQ queues consumed by MS4:

### Audit Queue
```javascript
await auditQueue.add('audit.action', {
  actor: userId,
  action: 'vote.cast',
  target: 'election',
  targetId: electionId,
});
```

### Notification Queue
```javascript
await notificationQueue.add('election.announced', {
  electionId: election.election_id,
  title: election.title,
  startTime: election.start_time,
  eligibleRoles: ['student', 'ec_member', 'admin'],
});
```

## Database Setup

MS2 requires:
1. PostgreSQL user `ms2user` with permissions on `election` schema
2. Read-only access to `auth.users` table for cross-schema queries

See `migrations/001_create_election_schema.sql` for schema creation.

## Testing the Service

### 1. Start Dependencies
```bash
# PostgreSQL and Redis must be running
docker-compose up postgres redis
```

### 2. Run Migrations
```bash
psql -U postgres -d cseduclub -f migrations/001_create_election_schema.sql
```

### 3. Start MS2
```bash
npm install
npm start
```

### 4. Test Endpoints

**Create Election (Admin only):**
```bash
curl -X POST http://localhost:3000/api/elections \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "EC Phase 1 Election 2026",
    "phase": 1,
    "rules": "One vote per student",
    "maxVotesPerUser": 1,
    "startTime": "2026-05-01T10:00:00Z",
    "endTime": "2026-05-01T18:00:00Z"
  }'
```

**List Elections (Public):**
```bash
curl http://localhost:3000/api/elections
```

**Cast Vote (Student):**
```bash
curl -X POST http://localhost:3000/api/elections/1/vote \
  -H "Authorization: Bearer <student-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"candidateId": 5}'
```

**Get Results (After close):**
```bash
curl http://localhost:3000/api/elections/1/results \
  -H "Authorization: Bearer <jwt>"
```

## Rate Limiting

The vote endpoint has strict rate limiting at the gateway:
- 30 requests per minute per IP
- Applied to all POST requests to `/api/elections/*`

## Error Responses

| Status | Scenario |
|--------|----------|
| 400 | Election not active or validation error |
| 403 | Insufficient permissions or results not available |
| 404 | Election or candidate not found |
| 409 | User already voted |
| 500 | Internal server error |

## Monitoring

Key metrics to monitor:
- Vote transaction duration (should be <100ms)
- Scheduler job success rate
- BullMQ queue depth
- Database connection pool usage
