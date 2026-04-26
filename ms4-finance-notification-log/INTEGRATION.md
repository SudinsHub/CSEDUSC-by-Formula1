# MS4 Integration Guide

This document describes how MS4 integrates with other microservices and how to emit jobs to its workers.

---

## Overview

MS4 has two integration points:

1. **REST API** - Called by API Gateway for budget and log management
2. **BullMQ Workers** - Consume jobs from `notifications` and `audit` queues

---

## REST API Integration

### Gateway Routing

The API Gateway should route requests to MS4:

```javascript
// In API Gateway
app.use('/api/budgets', proxy('http://ms4-finance:3004'));
app.use('/api/logs', proxy('http://ms4-finance:3004'));
```

### Required Headers

MS4 expects these headers from the Gateway (injected after JWT verification):

- `X-User-Id`: Integer user ID
- `X-User-Role`: User role (`student`, `ec_member`, `admin`)

**Example:**
```javascript
// Gateway middleware
req.headers['x-user-id'] = decodedToken.sub;
req.headers['x-user-role'] = decodedToken.role;
```

---

## BullMQ Integration

### Queue Setup

Other services should create queue instances to emit jobs:

```javascript
import { Queue } from 'bullmq';

const notificationQueue = new Queue('notifications', {
  connection: { url: process.env.REDIS_URL }
});

const auditQueue = new Queue('audit', {
  connection: { url: process.env.REDIS_URL }
});
```

---

## Notification Jobs

### Job Format

```javascript
await notificationQueue.add(jobName, payload);
```

### Supported Job Types

#### 1. User Approved (MS1)

```javascript
await notificationQueue.add('user.approved', {
  userId: 123,
  email: 'student@cse.du.ac.bd',
  name: 'John Doe'
});
```

#### 2. User Rejected (MS1)

```javascript
await notificationQueue.add('user.rejected', {
  userId: 123,
  email: 'student@cse.du.ac.bd',
  name: 'John Doe',
  reason: 'Invalid student ID' // optional
});
```

#### 3. Election Announced (MS2)

```javascript
await notificationQueue.add('election.announced', {
  electionId: 42,
  title: 'EC Election 2026',
  startTime: '2026-05-01T00:00:00Z',
  endTime: '2026-05-03T23:59:59Z',
  eligibleRoles: ['student', 'ec_member'] // optional, defaults to all
});
```

**Note:** MS4 will query `auth.users` to find all eligible voters and send individual emails.

#### 4. Event Registered (MS3)

```javascript
await notificationQueue.add('event.registered', {
  userId: 123,
  email: 'student@cse.du.ac.bd',
  eventId: 10,
  eventTitle: 'Tech Workshop 2026'
});
```

**Note:** MS4 will query `content.events` to fetch event date and location.

#### 5. Volunteer Decided (MS3)

```javascript
await notificationQueue.add('volunteer.decided', {
  userId: 123,
  email: 'student@cse.du.ac.bd',
  eventId: 10,
  eventTitle: 'Tech Workshop 2026',
  status: 'approved' // or 'rejected'
});
```

#### 6. Budget Decided (MS4)

```javascript
await notificationQueue.add('budget.decided', {
  userId: 100,
  email: 'ec@cse.du.ac.bd', // optional, will be fetched if not provided
  budgetId: 5,
  status: 'approved', // or 'rejected'
  comment: 'Looks good!' // optional
});
```

---

## Audit Jobs

### Job Format

```javascript
await auditQueue.add('audit.action', payload);
```

### Payload Structure

```javascript
{
  actor: 123,              // User ID who performed the action
  action: 'budget.approved', // Action type (see below)
  target: 'budget',        // Target entity type
  targetId: 5,             // Target entity ID
  details: {}              // Optional additional metadata
}
```

### Common Action Types

| Service | Action Type | Target | Description |
|---------|-------------|--------|-------------|
| MS1 | `user.registered` | `user` | New user registration |
| MS1 | `user.approved` | `user` | Admin approved user |
| MS1 | `user.rejected` | `user` | Admin rejected user |
| MS1 | `user.role_changed` | `user` | Admin changed user role |
| MS2 | `election.created` | `election` | Admin created election |
| MS2 | `election.opened` | `election` | Election auto-opened |
| MS2 | `election.closed` | `election` | Election auto-closed |
| MS2 | `vote.cast` | `election` | User cast a vote |
| MS2 | `candidate.added` | `candidate` | Candidate registered |
| MS3 | `event.created` | `event` | EC created event |
| MS3 | `event.cancelled` | `event` | EC cancelled event |
| MS3 | `event.registered` | `event` | User registered for event |
| MS3 | `volunteer.applied` | `event` | User applied as volunteer |
| MS3 | `volunteer.approved` | `event` | EC approved volunteer |
| MS3 | `notice.published` | `notice` | EC published notice |
| MS4 | `budget.submitted` | `budget` | EC submitted budget |
| MS4 | `budget.approved` | `budget` | Admin approved budget |
| MS4 | `budget.rejected` | `budget` | Admin rejected budget |
| MS4 | `expenditure.recorded` | `expenditure` | EC recorded expenditure |

### Example Usage

#### MS1 - User Approval

```javascript
// In MS1 UserService.approve()
await auditQueue.add('audit.action', {
  actor: adminId,
  action: 'user.approved',
  target: 'user',
  targetId: userId
});
```

#### MS2 - Vote Cast

```javascript
// In MS2 VoteService.castVote()
await auditQueue.add('audit.action', {
  actor: userId,
  action: 'vote.cast',
  target: 'election',
  targetId: electionId
});
```

#### MS3 - Event Registration

```javascript
// In MS3 EventService.registerAttendee()
await auditQueue.add('audit.action', {
  actor: userId,
  action: 'event.registered',
  target: 'event',
  targetId: eventId
});
```

---

## Cross-Schema Queries

MS4 has read access to `auth` and `content` schemas for enriching notifications.

### Examples

#### Fetch User Email (for notifications)

```javascript
const result = await pool.query(
  'SELECT email, name FROM auth.users WHERE user_id = $1',
  [userId]
);
```

#### Fetch Event Details (for event notifications)

```javascript
const result = await pool.query(
  'SELECT event_date, location FROM content.events WHERE event_id = $1',
  [eventId]
);
```

#### Fetch Eligible Voters (for election announcements)

```javascript
const result = await pool.query(
  'SELECT email, name FROM auth.users WHERE role = ANY($1) AND status = $2',
  [['student', 'ec_member'], 'active']
);
```

---

## Error Handling

### Notification Worker Failures

- **Retry Policy:** 3 attempts with exponential backoff (1s, 5s, 30s)
- **Failure Scenarios:**
  - SMTP connection failure
  - Invalid email address
  - Template rendering error
- **Logging:** All failures are logged to console with job ID and error details

### Audit Worker Failures

- **Retry Policy:** 3 attempts with exponential backoff (500ms, 2.5s, 12.5s)
- **Failure Scenarios:**
  - Database connection failure
  - Invalid payload structure
- **Logging:** All failures are logged to console

### Best Practices

1. **Fire-and-Forget:** Emit jobs outside database transactions
2. **Idempotency:** Jobs should be safe to retry (emails may be sent multiple times)
3. **Payload Validation:** Ensure all required fields are present before emitting
4. **Error Logging:** Log job emission failures in the producer service

---

## Testing Integration

### Manual Job Emission

You can manually emit jobs for testing using Redis CLI or a Node.js script:

```javascript
import { Queue } from 'bullmq';

const notificationQueue = new Queue('notifications', {
  connection: { url: 'redis://localhost:6379' }
});

// Test user approval notification
await notificationQueue.add('user.approved', {
  userId: 1,
  email: 'test@example.com',
  name: 'Test User'
});

console.log('Test job emitted');
```

### Monitoring Jobs

Use BullMQ Board or Redis CLI to monitor job status:

```bash
# Check queue length
redis-cli LLEN bull:notifications:wait

# View job data
redis-cli HGETALL bull:notifications:1
```

---

## Performance Considerations

### Notification Worker

- **Concurrency:** 5 concurrent jobs
- **Rate Limiting:** None (relies on SMTP provider limits)
- **Batch Emails:** Election announcements may send hundreds of emails sequentially

### Audit Worker

- **Concurrency:** 10 concurrent jobs
- **Write Performance:** Append-only writes are fast
- **Index Usage:** Ensure indexes on `logged_at`, `action_type`, `actor_user_id`

### Recommendations

1. **SMTP Provider:** Use a reliable provider with high rate limits (SendGrid, AWS SES)
2. **Redis Persistence:** Enable AOF persistence for job durability
3. **Database Connection Pool:** Default pool size (10) is sufficient
4. **Log Retention:** Implement archival for old activity logs (>6 months)

---

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Run database migration (`001_create_finance_schema.sql`)
- [ ] Verify Redis connectivity
- [ ] Test SMTP credentials
- [ ] Verify cross-schema read permissions for `ms4user`
- [ ] Start MS4 service
- [ ] Verify workers are running (check console logs)
- [ ] Test health endpoint: `GET /health`
- [ ] Emit test notification job
- [ ] Emit test audit job
- [ ] Verify email delivery
- [ ] Verify audit log insertion

---

## Troubleshooting

### Workers Not Processing Jobs

1. Check Redis connection: `redis-cli PING`
2. Verify queue exists: `redis-cli KEYS bull:notifications:*`
3. Check worker logs for errors
4. Verify `REDIS_URL` environment variable

### Emails Not Sending

1. Verify SMTP credentials
2. Check SMTP provider logs
3. Test SMTP connection manually:
   ```javascript
   await emailService.send('test@example.com', 'Test', '<p>Test</p>');
   ```
4. Check for rate limiting by SMTP provider

### Audit Logs Not Writing

1. Verify database connection
2. Check `finance.activity_logs` table exists
3. Verify `ms4user` has INSERT permission on `finance.activity_logs`
4. Check worker logs for SQL errors

### Cross-Schema Queries Failing

1. Verify `ms4user` has USAGE on `auth` and `content` schemas
2. Verify `ms4user` has SELECT on required tables
3. Check `search_path` in `db.js`: `-c search_path=finance,auth,content`

---

## Contact

For integration issues, contact:

**Owner:** Mahmud Hasan Walid  
**Team:** Formula1  
**Repository:** https://github.com/SudinsHub/CSEDUSC-by-Formula1.git
