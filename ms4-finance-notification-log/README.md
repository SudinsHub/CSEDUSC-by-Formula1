# MS4 - Finance, Notification & Logging Service

**Owner:** Mahmud Hasan Walid  
**Port:** 3004  
**Database Schema:** `finance`

## Overview

MS4 is a dual-purpose microservice that handles:

1. **Finance Management (REST API)**: Budget proposals, approvals, and expenditure tracking
2. **Notification & Logging (Workers)**: Asynchronous email delivery and audit log writing via BullMQ

This service consumes jobs from the `notifications` and `audit` queues produced by MS1, MS2, MS3, and its own budget REST endpoints.

---

## Architecture

### Components

- **REST API Server**: Express.js on port 3004
- **NotificationWorker**: BullMQ worker consuming `notifications` queue
- **AuditWorker**: BullMQ worker consuming `audit` queue
- **Database**: PostgreSQL `finance` schema with cross-schema read access to `auth` and `content`
- **Email Service**: Nodemailer with SMTP

### Module Structure

```
src/
├── config.js                    # Environment configuration
├── db.js                        # PostgreSQL connection pool
├── index.js                     # Express server + worker startup
├── middleware/
│   └── validate.js              # express-validator middleware
├── modules/
│   ├── budget/
│   │   ├── budget.controller.js # Budget REST handlers
│   │   ├── budget.routes.js     # Budget route definitions
│   │   └── budget.schema.js     # Validation schemas
│   └── log/
│       ├── log.controller.js    # Activity log REST handlers
│       └── log.routes.js        # Log route definitions
├── repositories/
│   ├── budgetRepository.js      # Budget data access
│   ├── expenditureRepository.js # Expenditure data access
│   └── logRepository.js         # Activity log data access
├── services/
│   ├── budgetService.js         # Budget business logic
│   ├── logService.js            # Log business logic
│   └── emailService.js          # Email sending + templates
├── workers/
│   ├── notificationWorker.js    # Email notification worker
│   └── auditWorker.js           # Audit log writer worker
└── queues/
    └── index.js                 # BullMQ queue instances
```

---

## Database Schema

### Tables

#### `finance.budgets`
| Column | Type | Description |
|--------|------|-------------|
| budget_id | SERIAL PK | Auto-incrementing primary key |
| event_id | INTEGER | Cross-schema ref to `content.events.event_id` |
| proposed_by | INTEGER | Cross-schema ref to `auth.users.user_id` |
| status | VARCHAR(20) | `pending_review`, `approved`, `rejected` |
| total_amount | NUMERIC(12,2) | Sum of line items |
| line_items | JSONB | Array of `{category, estimatedCost}` |
| admin_comment | TEXT | Rejection/approval note |
| reviewed_by | INTEGER | Cross-schema ref to `auth.users.user_id` |
| submitted_at | TIMESTAMPTZ | Submission timestamp |
| reviewed_at | TIMESTAMPTZ | Review timestamp |

#### `finance.expenditures`
| Column | Type | Description |
|--------|------|-------------|
| expenditure_id | SERIAL PK | Auto-incrementing primary key |
| budget_id | INTEGER FK | References `finance.budgets` |
| category | VARCHAR(100) | Expenditure category |
| amount | NUMERIC(12,2) | Actual amount spent |
| description | TEXT | Expenditure description |
| recorded_at | TIMESTAMPTZ | Recording timestamp |
| recorded_by | INTEGER | Cross-schema ref to `auth.users.user_id` |

#### `finance.activity_logs`
| Column | Type | Description |
|--------|------|-------------|
| log_id | SERIAL PK | Auto-incrementing primary key |
| actor_user_id | INTEGER | Cross-schema ref to `auth.users.user_id` |
| action_type | VARCHAR(80) | e.g., `user.approved`, `budget.decided` |
| target_entity | VARCHAR(60) | e.g., `user`, `election`, `budget` |
| target_entity_id | INTEGER | ID of affected record |
| details | JSONB | Additional metadata |
| logged_at | TIMESTAMPTZ | Log timestamp |

---

## REST API Endpoints

### Budget Management

#### `POST /api/budgets`
Submit a new budget proposal.

**Auth:** EC Member or Admin  
**Request Body:**
```json
{
  "eventId": 42,
  "totalAmount": 15000.00,
  "lineItems": [
    { "category": "Venue", "estimatedCost": 8000.00 },
    { "category": "Catering", "estimatedCost": 5000.00 },
    { "category": "Materials", "estimatedCost": 2000.00 }
  ]
}
```
**Response:** `201 Created`
```json
{
  "budget_id": 1,
  "event_id": 42,
  "proposed_by": 100,
  "status": "pending_review",
  "total_amount": "15000.00",
  "line_items": [...],
  "submitted_at": "2026-04-16T10:30:00Z"
}
```

---

#### `GET /api/budgets`
List all budget proposals.

**Auth:** Admin  
**Response:** `200 OK`
```json
[
  {
    "budget_id": 1,
    "event_id": 42,
    "proposed_by": 100,
    "status": "pending_review",
    "total_amount": "15000.00",
    "submitted_at": "2026-04-16T10:30:00Z"
  }
]
```

---

#### `GET /api/budgets/:id`
Get a specific budget proposal.

**Auth:** EC Member (own proposals only) or Admin  
**Response:** `200 OK`
```json
{
  "budget_id": 1,
  "event_id": 42,
  "proposed_by": 100,
  "status": "approved",
  "total_amount": "15000.00",
  "line_items": [...],
  "admin_comment": null,
  "reviewed_by": 5,
  "reviewed_at": "2026-04-16T14:00:00Z"
}
```

**Error:** `403 Forbidden` if EC member tries to access another member's budget

---

#### `PATCH /api/budgets/:id/approve`
Approve a budget proposal.

**Auth:** Admin only  
**Response:** `200 OK`
```json
{
  "budget_id": 1,
  "status": "approved",
  "reviewed_by": 5,
  "reviewed_at": "2026-04-16T14:00:00Z"
}
```

**Side Effects:**
- Enqueues `budget.decided` notification job
- Enqueues `budget.approved` audit log job

---

#### `PATCH /api/budgets/:id/reject`
Reject a budget proposal.

**Auth:** Admin only  
**Request Body:**
```json
{
  "comment": "Budget exceeds event allocation. Please revise."
}
```
**Response:** `200 OK`

**Side Effects:**
- Enqueues `budget.decided` notification job with comment
- Enqueues `budget.rejected` audit log job

---

#### `POST /api/budgets/:id/expenditures`
Record an expenditure against an approved budget.

**Auth:** EC Member or Admin  
**Request Body:**
```json
{
  "category": "Venue",
  "amount": 7500.00,
  "description": "Auditorium rental for 3 hours"
}
```
**Response:** `201 Created`
```json
{
  "expenditure_id": 1,
  "budget_id": 1,
  "category": "Venue",
  "amount": "7500.00",
  "description": "Auditorium rental for 3 hours",
  "recorded_at": "2026-04-20T09:00:00Z",
  "recorded_by": 100
}
```

**Error:** `400 Bad Request` if budget is not approved

---

#### `GET /api/budgets/:id/expenditures`
List all expenditures for a budget.

**Auth:** Admin  
**Response:** `200 OK`
```json
[
  {
    "expenditure_id": 1,
    "budget_id": 1,
    "category": "Venue",
    "amount": "7500.00",
    "recorded_at": "2026-04-20T09:00:00Z"
  }
]
```

---

### Activity Logs

#### `GET /api/logs`
Retrieve activity logs with optional filters.

**Auth:** Admin only  
**Query Parameters:**
- `actorUserId` (optional): Filter by actor user ID
- `actionType` (optional): Filter by action type (e.g., `budget.approved`)
- `targetEntity` (optional): Filter by target entity (e.g., `budget`)
- `startDate` (optional): ISO 8601 date (e.g., `2026-04-01T00:00:00Z`)
- `endDate` (optional): ISO 8601 date
- `limit` (optional): Max results (1-1000, default 100)

**Response:** `200 OK`
```json
[
  {
    "log_id": 1,
    "actor_user_id": 5,
    "action_type": "budget.approved",
    "target_entity": "budget",
    "target_entity_id": 1,
    "details": {},
    "logged_at": "2026-04-16T14:00:00Z"
  }
]
```

---

## BullMQ Workers

### NotificationWorker

Consumes jobs from the `notifications` queue and sends emails via SMTP.

**Supported Job Types:**

| Job Name | Payload | Action |
|----------|---------|--------|
| `user.approved` | `{userId, email, name}` | Send welcome email |
| `user.rejected` | `{userId, email, name, reason}` | Send rejection email |
| `election.announced` | `{electionId, title, startTime, endTime, eligibleRoles}` | Send announcement to eligible voters |
| `event.registered` | `{userId, email, eventId, eventTitle}` | Send registration confirmation |
| `volunteer.decided` | `{userId, email, eventId, eventTitle, status}` | Send volunteer decision |
| `budget.decided` | `{userId, email, budgetId, status, comment}` | Send budget decision |

**Retry Policy:** 3 attempts with exponential backoff (1s, 5s, 30s)

**Email Templates:** Defined in `src/services/emailService.js`

---

### AuditWorker

Consumes jobs from the `audit` queue and writes to `finance.activity_logs`.

**Job Payload:**
```json
{
  "actor": 100,
  "action": "budget.approved",
  "target": "budget",
  "targetId": 1,
  "details": {}
}
```

**Retry Policy:** 3 attempts with exponential backoff (500ms, 2.5s, 12.5s)

**Append-Only:** No updates or deletes are ever issued against `activity_logs`

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3004
DATABASE_URL=postgres://ms4user:password@localhost:5432/cseduclub
REDIS_URL=redis://localhost:6379
NODE_ENV=development

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=CSEDU Club <noreply@cseduclub.com>
```

---

## Installation & Running

### Install Dependencies
```bash
npm install
```

### Run Database Migration
```bash
psql -U postgres -d cseduclub -f migrations/001_create_finance_schema.sql
```

### Start Service
```bash
npm start
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

---

## Integration with Other Services

### MS1 (User & Auth)
- **Produces:** `user.approved`, `user.rejected` → `notifications` queue
- **Produces:** `audit.action` → `audit` queue
- **Cross-schema reads:** MS4 reads `auth.users` for email lookups

### MS2 (Election)
- **Produces:** `election.announced` → `notifications` queue
- **Produces:** `audit.action` → `audit` queue

### MS3 (Event/Notice/Media)
- **Produces:** `event.registered`, `volunteer.decided` → `notifications` queue
- **Produces:** `audit.action` → `audit` queue
- **Cross-schema reads:** MS4 reads `content.events` for event details

### MS4 Budget REST
- **Produces:** `budget.decided` → `notifications` queue
- **Produces:** `audit.action` → `audit` queue

---

## Security & Access Control

### Role-Based Access Control (RBAC)

| Action | Visitor | Student | EC Member | Admin |
|--------|---------|---------|-----------|-------|
| Submit budget | ❌ | ❌ | ✅ | ✅ |
| View own budget | ❌ | ❌ | ✅ | ✅ |
| View all budgets | ❌ | ❌ | ❌ | ✅ |
| Approve/reject budget | ❌ | ❌ | ❌ | ✅ |
| Record expenditure | ❌ | ❌ | ✅ | ✅ |
| View activity logs | ❌ | ❌ | ❌ | ✅ |

### Financial Access Control (FR23)
EC members can only view their own budget proposals. Admins can view all budgets.

**Implementation:** `budgetService.getById()` checks `proposed_by` against `requesterId` for EC members.

---

## Testing

### Health Check
```bash
curl http://localhost:3004/health
```

### Submit Budget (as EC Member)
```bash
curl -X POST http://localhost:3004/api/budgets \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 100" \
  -H "X-User-Role: ec_member" \
  -d '{
    "eventId": 42,
    "totalAmount": 15000.00,
    "lineItems": [
      {"category": "Venue", "estimatedCost": 8000.00}
    ]
  }'
```

### Approve Budget (as Admin)
```bash
curl -X PATCH http://localhost:3004/api/budgets/1/approve \
  -H "X-User-Id: 5" \
  -H "X-User-Role: admin"
```

### View Activity Logs (as Admin)
```bash
curl http://localhost:3004/api/logs?limit=50 \
  -H "X-User-Id: 5" \
  -H "X-User-Role: admin"
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "errors": [
    {
      "msg": "Total amount must be a non-negative number",
      "param": "totalAmount",
      "location": "body"
    }
  ]
}
```

**403 Forbidden**
```json
{
  "error": "Only admins can approve budgets"
}
```

**404 Not Found**
```json
{
  "error": "Budget not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to submit budget"
}
```

---

## Monitoring & Logging

### Console Logs
- Worker job processing: `Processing notification job: user.approved`
- Email sent: `Email sent to user@example.com: <messageId>`
- Audit log written: `Audit log written: budget.approved by user 5 on budget 1`

### BullMQ Events
- Job completed: `Notification job 123 completed`
- Job failed: `Notification job 123 failed: <error>`

---

## Future Enhancements

1. **Budget Amendments**: Allow EC members to revise rejected budgets
2. **Expenditure Limits**: Validate expenditures don't exceed approved budget
3. **Email Templates**: Move to external template files (Handlebars/EJS)
4. **Notification Preferences**: Allow users to opt-out of certain emails
5. **Log Retention**: Implement automatic archival of old activity logs
6. **Metrics Dashboard**: Expose Prometheus metrics for monitoring

---

## License

ISC

---

## Contact

**Owner:** Mahmud Hasan Walid  
**Team:** Formula1  
**Course:** CSE-4113 Internet Programming Lab, University of Dhaka
