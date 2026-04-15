# MS3 Event, Notice & Media Service - Integration Guide

**Owner:** Md. Al Habib  
**Port:** 3003  
**Database Schema:** `content`  
**Version:** 1.0.0

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Configuration](#setup--configuration)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [File Upload](#file-upload)
8. [Event Flow](#event-flow)
9. [Integration with Other Services](#integration-with-other-services)
10. [Error Handling](#error-handling)

---

## Overview

MS3 manages the club's content layer:
- **Events**: Creation, registration, volunteer coordination
- **Notices**: Public notice board with priority and expiry
- **Media**: File uploads (images, videos, PDFs) linked to events/notices

### Key Features
- Event lifecycle management (create, update, cancel)
- Attendee registration and volunteer applications
- Volunteer approval/rejection workflow
- Priority-based notice board with expiry dates
- File upload with MIME type validation
- Asynchronous notifications via BullMQ
- Audit logging for all actions

---

## Architecture

### Module Structure
```
ms3-event-notice-media/
├── src/
│   ├── config.js                 # Environment configuration
│   ├── db.js                     # PostgreSQL connection pool
│   ├── index.js                  # Express app entry point
│   ├── middleware/
│   │   ├── validate.js           # Joi validation middleware
│   │   └── requireRole.js        # RBAC middleware
│   ├── queues/
│   │   └── index.js              # BullMQ queue setup
│   ├── repositories/
│   │   ├── eventRepository.js
│   │   ├── eventRegistrationRepository.js
│   │   ├── noticeRepository.js
│   │   └── mediaRepository.js
│   ├── services/
│   │   ├── eventService.js
│   │   ├── noticeService.js
│   │   ├── mediaService.js
│   │   └── fileStorageService.js
│   └── modules/
│       ├── event/
│       │   ├── event.routes.js
│       │   ├── event.controller.js
│       │   └── event.schema.js
│       ├── notice/
│       │   ├── notice.routes.js
│       │   ├── notice.controller.js
│       │   └── notice.schema.js
│       └── media/
│           ├── media.routes.js
│           └── media.controller.js
```


---

## Setup & Configuration

### 1. Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://ms3user:ms3password@localhost:5432/cseduclub

# Redis Configuration (for BullMQ)
REDIS_URL=redis://localhost:6379

# File Upload Configuration
UPLOAD_DIR=/var/uploads
UPLOAD_MAX_SIZE_MB=10

# Allowed MIME types (comma-separated)
ALLOWED_MIME_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
```

### 2. Database Setup

Run the migration script to create the `content` schema:

```bash
psql -U postgres -d cseduclub -f migrations/001_create_content_schema.sql
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Service

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## API Endpoints

All endpoints are prefixed with `/api` and routed through the API Gateway at port 3000.

### Events

#### 1. Create Event
```http
POST /api/events
Authorization: Required (EC Member or Administrator)
Content-Type: application/json

{
  "title": "Annual Tech Fest 2026",
  "description": "A celebration of technology and innovation",
  "event_date": "2026-05-15T10:00:00Z",
  "location": "CSE Auditorium",
  "volunteers_needed": 10
}

Response: 201 Created
{
  "event_id": 1,
  "title": "Annual Tech Fest 2026",
  "description": "A celebration of technology and innovation",
  "event_date": "2026-05-15T10:00:00.000Z",
  "location": "CSE Auditorium",
  "volunteers_needed": 10,
  "status": "open",
  "created_by": 5,
  "created_at": "2026-04-15T12:00:00.000Z"
}
```

#### 2. List All Events
```http
GET /api/events
Authorization: Not required (public)

Response: 200 OK
[
  {
    "event_id": 1,
    "title": "Annual Tech Fest 2026",
    "description": "A celebration of technology and innovation",
    "event_date": "2026-05-15T10:00:00.000Z",
    "location": "CSE Auditorium",
    "volunteers_needed": 10,
    "status": "open",
    "created_by": 5,
    "created_at": "2026-04-15T12:00:00.000Z",
    "attendee_count": "25",
    "volunteer_count": "8"
  }
]
```


#### 3. Get Event by ID
```http
GET /api/events/:id
Authorization: Not required (public)

Response: 200 OK
{
  "event_id": 1,
  "title": "Annual Tech Fest 2026",
  "description": "A celebration of technology and innovation",
  "event_date": "2026-05-15T10:00:00.000Z",
  "location": "CSE Auditorium",
  "volunteers_needed": 10,
  "status": "open",
  "created_by": 5,
  "created_at": "2026-04-15T12:00:00.000Z",
  "attendee_count": "25",
  "volunteer_count": "8"
}
```

#### 4. Update Event
```http
PATCH /api/events/:id
Authorization: Required (EC Member or Administrator)
Content-Type: application/json

{
  "title": "Annual Tech Fest 2026 - Updated",
  "volunteers_needed": 15
}

Response: 200 OK
{
  "event_id": 1,
  "title": "Annual Tech Fest 2026 - Updated",
  "volunteers_needed": 15,
  ...
}
```

#### 5. Cancel Event
```http
DELETE /api/events/:id
Authorization: Required (EC Member or Administrator)

Response: 200 OK
{
  "event_id": 1,
  "status": "cancelled",
  ...
}
```

#### 6. Register as Attendee
```http
POST /api/events/:id/register
Authorization: Required (Student or above)

Response: 201 Created
{
  "registration_id": 1,
  "event_id": 1,
  "user_id": 10,
  "type": "attendee",
  "status": "approved",
  "registered_at": "2026-04-15T14:00:00.000Z"
}
```

#### 7. Apply as Volunteer
```http
POST /api/events/:id/volunteer
Authorization: Required (Student or above)

Response: 201 Created
{
  "registration_id": 2,
  "event_id": 1,
  "user_id": 10,
  "type": "volunteer",
  "status": "pending",
  "registered_at": "2026-04-15T14:00:00.000Z"
}
```

#### 8. List Event Registrations
```http
GET /api/events/:id/registrations
Authorization: Required (EC Member or Administrator)

Response: 200 OK
[
  {
    "registration_id": 1,
    "event_id": 1,
    "user_id": 10,
    "type": "attendee",
    "status": "approved",
    "registered_at": "2026-04-15T14:00:00.000Z",
    "user_name": "John Doe",
    "user_email": "john@cse.du.ac.bd",
    "batch_year": 2021
  }
]
```

#### 9. Manage Volunteer Application
```http
PATCH /api/events/:id/volunteers/:vid
Authorization: Required (EC Member or Administrator)
Content-Type: application/json

{
  "status": "approved"
}

Response: 200 OK
{
  "registration_id": 2,
  "status": "approved",
  ...
}
```


### Notices

#### 1. Publish Notice
```http
POST /api/notices
Authorization: Required (EC Member or Administrator)
Content-Type: application/json

{
  "title": "Semester Break Notice",
  "content": "The club will be closed during the semester break from June 1 to June 15.",
  "priority": "urgent",
  "expiry_date": "2026-06-15"
}

Response: 201 Created
{
  "notice_id": 1,
  "title": "Semester Break Notice",
  "content": "The club will be closed during the semester break from June 1 to June 15.",
  "priority": "urgent",
  "expiry_date": "2026-06-15",
  "created_by": 5,
  "published_at": "2026-04-15T12:00:00.000Z"
}
```

#### 2. List Active Notices
```http
GET /api/notices
Authorization: Not required (public)

Response: 200 OK
[
  {
    "notice_id": 1,
    "title": "Semester Break Notice",
    "content": "The club will be closed during the semester break from June 1 to June 15.",
    "priority": "urgent",
    "expiry_date": "2026-06-15",
    "created_by": 5,
    "published_at": "2026-04-15T12:00:00.000Z",
    "author_name": "Admin User"
  }
]
```

#### 3. Get Notice by ID
```http
GET /api/notices/:id
Authorization: Not required (public)

Response: 200 OK
{
  "notice_id": 1,
  "title": "Semester Break Notice",
  "content": "The club will be closed during the semester break from June 1 to June 15.",
  "priority": "urgent",
  "expiry_date": "2026-06-15",
  "created_by": 5,
  "published_at": "2026-04-15T12:00:00.000Z",
  "author_name": "Admin User",
  "author_email": "admin@cse.du.ac.bd"
}
```

#### 4. Update Notice
```http
PATCH /api/notices/:id
Authorization: Required (EC Member or Administrator)
Content-Type: application/json

{
  "priority": "normal",
  "expiry_date": "2026-06-20"
}

Response: 200 OK
{
  "notice_id": 1,
  "priority": "normal",
  "expiry_date": "2026-06-20",
  ...
}
```

### Media

#### 1. Upload Media File
```http
POST /api/media/upload
Authorization: Required (EC Member or Administrator)
Content-Type: multipart/form-data

Form Data:
- file: [binary file]
- event_id: 1 (optional)
- notice_id: 2 (optional)

Response: 201 Created
{
  "media_id": 1,
  "file_path": "2026/04/550e8400-e29b-41d4-a716-446655440000.jpg",
  "file_type": "image/jpeg",
  "event_id": 1,
  "notice_id": null,
  "uploaded_by": 5,
  "uploaded_at": "2026-04-15T12:00:00.000Z"
}
```


#### 2. List All Media
```http
GET /api/media
Authorization: Not required (public)

Response: 200 OK
[
  {
    "media_id": 1,
    "file_path": "2026/04/550e8400-e29b-41d4-a716-446655440000.jpg",
    "file_type": "image/jpeg",
    "event_id": 1,
    "notice_id": null,
    "uploaded_by": 5,
    "uploaded_at": "2026-04-15T12:00:00.000Z",
    "uploader_name": "Admin User",
    "event_title": "Annual Tech Fest 2026",
    "notice_title": null
  }
]
```

#### 3. Stream/Download Media File
```http
GET /api/media/:id/file
Authorization: Not required (public)

Response: 200 OK
Content-Type: image/jpeg (or appropriate MIME type)
Content-Disposition: inline; filename="550e8400-e29b-41d4-a716-446655440000.jpg"

[Binary file stream]
```

---

## Database Schema

### Tables

#### 1. `content.events`
| Column | Type | Description |
|--------|------|-------------|
| event_id | SERIAL PK | Auto-incrementing primary key |
| title | VARCHAR(200) | Event title |
| description | TEXT | Event description |
| event_date | TIMESTAMPTZ | Event date and time |
| location | VARCHAR(300) | Event location |
| volunteers_needed | INTEGER | Number of volunteers needed |
| status | VARCHAR(20) | open, closed, cancelled |
| created_by | INTEGER | User ID (cross-schema ref to auth.users) |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### 2. `content.event_registrations`
| Column | Type | Description |
|--------|------|-------------|
| registration_id | SERIAL PK | Auto-incrementing primary key |
| event_id | INTEGER FK | References content.events |
| user_id | INTEGER | User ID (cross-schema ref to auth.users) |
| type | VARCHAR(20) | attendee or volunteer |
| status | VARCHAR(20) | pending, approved, rejected |
| registered_at | TIMESTAMPTZ | Registration timestamp |

**Unique Constraint:** (event_id, user_id) - One registration per user per event

#### 3. `content.notices`
| Column | Type | Description |
|--------|------|-------------|
| notice_id | SERIAL PK | Auto-incrementing primary key |
| title | VARCHAR(200) | Notice title |
| content | TEXT | Notice content |
| priority | VARCHAR(10) | low, normal, urgent |
| expiry_date | DATE | Expiry date (nullable) |
| created_by | INTEGER | User ID (cross-schema ref to auth.users) |
| published_at | TIMESTAMPTZ | Publication timestamp |

#### 4. `content.media`
| Column | Type | Description |
|--------|------|-------------|
| media_id | SERIAL PK | Auto-incrementing primary key |
| file_path | TEXT | Relative path: YYYY/MM/uuid.ext |
| file_type | VARCHAR(50) | MIME type |
| event_id | INTEGER FK | References content.events (nullable) |
| notice_id | INTEGER FK | References content.notices (nullable) |
| uploaded_by | INTEGER | User ID (cross-schema ref to auth.users) |
| uploaded_at | TIMESTAMPTZ | Upload timestamp |


---

## Authentication & Authorization

MS3 relies on the API Gateway for JWT verification. The Gateway injects user information via headers:

- `X-User-Id`: User's ID
- `X-User-Role`: User's role
- `X-User-Email`: User's email

### Role Hierarchy

| Role | Value | Permissions |
|------|-------|-------------|
| Public Visitor | PublicVisitor | View events, notices, media |
| General Student | GeneralStudent | + Register for events, apply as volunteer |
| EC Member | ECMember | + Create/update events, publish notices, upload media, manage volunteers |
| Administrator | Administrator | All permissions |

### Role-Based Access Control

The `requireRole` middleware enforces access control:

```javascript
// Example: Only EC Members and Administrators can create events
router.post('/', requireRole(['ECMember', 'Administrator']), eventController.create);
```

### Public vs Protected Routes

**Public Routes (No authentication required):**
- GET /api/events
- GET /api/events/:id
- GET /api/notices
- GET /api/notices/:id
- GET /api/media
- GET /api/media/:id/file

**Protected Routes:**
- All POST, PATCH, DELETE operations require authentication
- Student-level routes: Event registration, volunteer application
- EC/Admin routes: Event/notice management, volunteer approval, media upload

---

## File Upload

### Configuration

File uploads are handled by `multer` middleware with the following constraints:

- **Max file size:** 10 MB (configurable via `UPLOAD_MAX_SIZE_MB`)
- **Allowed MIME types:**
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `video/mp4`
  - `application/pdf`

### Storage Structure

Files are stored in the filesystem with the following structure:

```
/var/uploads/
  └── YYYY/
      └── MM/
          └── {uuid}.{ext}
```

Example: `/var/uploads/2026/04/550e8400-e29b-41d4-a716-446655440000.jpg`

### Upload Process

1. Client sends multipart/form-data request with file
2. Multer temporarily stores file in `/tmp`
3. `fileStorageService.save()` validates and moves file to final location
4. Metadata is saved to `content.media` table
5. Audit log is emitted to BullMQ

### Frontend Integration Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('event_id', '1');

const response = await fetch('http://localhost:3000/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const media = await response.json();
console.log('Uploaded:', media);
```


---

## Event Flow

### Event Creation Flow

```
1. EC Member/Admin creates event via POST /api/events
   ↓
2. eventService.create() inserts into content.events
   ↓
3. Audit log emitted to BullMQ (event.created)
   ↓
4. Event returned to client with status 'open'
```

### Attendee Registration Flow

```
1. Student registers via POST /api/events/:id/register
   ↓
2. eventService.registerAttendee() checks:
   - Event exists and is 'open'
   - User not already registered
   ↓
3. Insert into event_registrations with status 'approved'
   ↓
4. Notification emitted to BullMQ (event.registered)
   ↓
5. Audit log emitted (event.registered)
   ↓
6. MS4 NotificationWorker sends confirmation email
```

### Volunteer Application Flow

```
1. Student applies via POST /api/events/:id/volunteer
   ↓
2. eventService.applyVolunteer() checks:
   - Event exists and is 'open'
   - User not already applied
   ↓
3. Insert into event_registrations with status 'pending'
   ↓
4. Audit log emitted (volunteer.applied)
   ↓
5. EC Member/Admin reviews via GET /api/events/:id/registrations
   ↓
6. EC Member/Admin approves/rejects via PATCH /api/events/:id/volunteers/:vid
   ↓
7. Notification emitted to BullMQ (volunteer.decided)
   ↓
8. MS4 NotificationWorker sends decision email to volunteer
```

### Notice Publication Flow

```
1. EC Member/Admin publishes notice via POST /api/notices
   ↓
2. noticeService.publish() inserts into content.notices
   ↓
3. Audit log emitted (notice.published)
   ↓
4. Notice appears on public board (GET /api/notices)
   ↓
5. Notices are sorted by priority (urgent > normal > low)
   ↓
6. Expired notices (expiry_date < today) are automatically hidden
```

---

## Integration with Other Services

### MS1 (Auth Service)

**Cross-Schema Queries:**
MS3 reads from `auth.users` for user information in registrations and media listings.

```sql
-- Example: Get user details for event registrations
SELECT er.*, u.name, u.email, u.batch_year
FROM content.event_registrations er
LEFT JOIN auth.users u ON er.user_id = u.user_id
WHERE er.event_id = $1
```

**No Direct API Calls:**
MS3 does not make HTTP requests to MS1. All user authentication is handled by the API Gateway.

### MS4 (Finance, Notification & Logging Service)

**BullMQ Integration:**

MS3 emits events to two queues:

1. **Notifications Queue** (`notifications`)
   - `event.registered`: Sent when user registers for event
   - `volunteer.decided`: Sent when volunteer application is approved/rejected

2. **Audit Queue** (`audit`)
   - All create, update, delete operations
   - Event types: `event.created`, `event.updated`, `event.cancelled`, `notice.published`, `media.uploaded`, etc.

**Example Event Emission:**

```javascript
// Emit notification
await emitNotification('event.registered', {
  userId: 10,
  eventId: 1,
  eventTitle: 'Annual Tech Fest 2026',
  type: 'attendee'
});

// Emit audit log
await emitAudit({
  actor: 10,
  action: 'event.registered',
  target: 'event',
  targetId: 1,
  details: { type: 'attendee' }
});
```


### API Gateway

**Route Mapping:**

The API Gateway forwards requests to MS3 based on path prefixes:

```javascript
// In API Gateway configuration
{
  path: '/api/events/*',
  target: 'http://ms3-event-notice-media:3003'
},
{
  path: '/api/notices/*',
  target: 'http://ms3-event-notice-media:3003'
},
{
  path: '/api/media/*',
  target: 'http://ms3-event-notice-media:3003'
}
```

**Header Injection:**

The Gateway injects user headers after JWT verification:
- `X-User-Id`
- `X-User-Role`
- `X-User-Email`

MS3 trusts these headers unconditionally (internal network).

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, invalid file type |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Already registered, duplicate entry |
| 500 | Internal Server Error | Unexpected server error |

### Common Error Scenarios

#### 1. Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    "\"title\" is required",
    "\"event_date\" must be a valid ISO 8601 date"
  ]
}
```

#### 2. Already Registered
```json
{
  "error": "You are already registered for this event"
}
```

#### 3. Event Not Open
```json
{
  "error": "Event is not open for registration"
}
```

#### 4. File Too Large
```json
{
  "error": "File too large. Maximum size is 10MB"
}
```

#### 5. Invalid File Type
```json
{
  "error": "File type application/zip not allowed"
}
```

#### 6. Insufficient Permissions
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

---

## Testing

### Health Check

```bash
curl http://localhost:3003/health
```

Response:
```json
{
  "status": "ok",
  "service": "ms3-event-notice-media",
  "uptime": 3600
}
```

### Example Test Scenarios

#### 1. Create Event (as EC Member)
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer <ec_member_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "Test Description",
    "event_date": "2026-06-01T10:00:00Z",
    "location": "Test Location",
    "volunteers_needed": 5
  }'
```

#### 2. Register for Event (as Student)
```bash
curl -X POST http://localhost:3000/api/events/1/register \
  -H "Authorization: Bearer <student_token>"
```

#### 3. Upload Media (as EC Member)
```bash
curl -X POST http://localhost:3000/api/media/upload \
  -H "Authorization: Bearer <ec_member_token>" \
  -F "file=@/path/to/image.jpg" \
  -F "event_id=1"
```


---

## Frontend Integration Guide

### React Example: Event List Component

```javascript
import { useState, useEffect } from 'react';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => console.error('Error fetching events:', err));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Upcoming Events</h1>
      {events.map(event => (
        <div key={event.event_id}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
          <p>Date: {new Date(event.event_date).toLocaleDateString()}</p>
          <p>Location: {event.location}</p>
          <p>Attendees: {event.attendee_count}</p>
          <p>Volunteers: {event.volunteer_count}/{event.volunteers_needed}</p>
        </div>
      ))}
    </div>
  );
}
```

### React Example: Event Registration

```javascript
async function registerForEvent(eventId, accessToken) {
  try {
    const response = await fetch(`http://localhost:3000/api/events/${eventId}/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const registration = await response.json();
    console.log('Registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Registration failed:', error.message);
    throw error;
  }
}
```

### React Example: Notice Board

```javascript
import { useState, useEffect } from 'react';

function NoticeBoard() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/notices')
      .then(res => res.json())
      .then(data => setNotices(data))
      .catch(err => console.error('Error fetching notices:', err));
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'normal': return 'blue';
      case 'low': return 'gray';
      default: return 'black';
    }
  };

  return (
    <div>
      <h1>Notice Board</h1>
      {notices.map(notice => (
        <div key={notice.notice_id} style={{ borderLeft: `4px solid ${getPriorityColor(notice.priority)}` }}>
          <h3>{notice.title}</h3>
          <p>{notice.content}</p>
          <small>By {notice.author_name} on {new Date(notice.published_at).toLocaleDateString()}</small>
          {notice.expiry_date && (
            <small> | Expires: {new Date(notice.expiry_date).toLocaleDateString()}</small>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Deployment

### Docker Compose

MS3 is deployed as part of the overall system using Docker Compose:

```yaml
ms3-event-notice-media:
  build: ./ms3-event-notice-media
  ports:
    - "3003:3003"
  environment:
    DATABASE_URL: postgresql://ms3user:${MS3_DB_PASS}@postgres/cseduclub
    REDIS_URL: redis://redis:6379
    UPLOAD_DIR: /var/uploads
  volumes:
    - media_uploads:/var/uploads
  depends_on:
    - postgres
    - redis
```

### Environment Variables in Production

Ensure the following are set in production:

- `DATABASE_URL`: PostgreSQL connection string with proper credentials
- `REDIS_URL`: Redis connection string
- `UPLOAD_DIR`: Persistent volume mount for file storage
- `UPLOAD_MAX_SIZE_MB`: Adjust based on server capacity
- `ALLOWED_MIME_TYPES`: Restrict to necessary file types

---

## Troubleshooting

### Issue: "Missing user headers"

**Cause:** Request not routed through API Gateway  
**Solution:** Ensure all requests go through the Gateway at port 3000

### Issue: "File type not allowed"

**Cause:** Uploaded file MIME type not in allowed list  
**Solution:** Check `ALLOWED_MIME_TYPES` environment variable

### Issue: "File too large"

**Cause:** File exceeds `UPLOAD_MAX_SIZE_MB` limit  
**Solution:** Increase limit or compress file before upload

### Issue: "Event not found"

**Cause:** Invalid event ID or event deleted  
**Solution:** Verify event exists via GET /api/events

### Issue: "Already registered"

**Cause:** User already has a registration for this event  
**Solution:** Check existing registrations before attempting to register

---

## Contact & Support

**Service Owner:** Md. Al Habib  
**Team:** Formula1  
**Repository:** https://github.com/SudinsHub/CSEDUSC-by-Formula1.git

For issues or questions, please refer to the main project documentation or contact the development team.
