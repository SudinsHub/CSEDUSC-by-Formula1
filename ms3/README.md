# MS3 - Event, Notice & Media Service

**Owner:** Md. Al Habib  
**Port:** 3003  
**Database Schema:** `content`

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Database Migration
```bash
psql -U postgres -d cseduclub -f migrations/001_create_content_schema.sql
```

### 4. Start Service
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Service Overview

MS3 manages the club's content layer:
- **Events**: Creation, registration, volunteer coordination
- **Notices**: Public notice board with priority and expiry
- **Media**: File uploads (images, videos, PDFs)

## Key Features

- Event lifecycle management (create, update, cancel)
- Attendee registration and volunteer applications
- Volunteer approval/rejection workflow
- Priority-based notice board with expiry dates
- File upload with MIME type validation (max 10MB)
- Asynchronous notifications via BullMQ
- Comprehensive audit logging

## API Endpoints

### Events
- `POST /api/events` - Create event (EC/Admin)
- `GET /api/events` - List all events (Public)
- `GET /api/events/:id` - Get event details (Public)
- `PATCH /api/events/:id` - Update event (EC/Admin)
- `DELETE /api/events/:id` - Cancel event (EC/Admin)
- `POST /api/events/:id/register` - Register as attendee (Student+)
- `POST /api/events/:id/volunteer` - Apply as volunteer (Student+)
- `GET /api/events/:id/registrations` - List registrations (EC/Admin)
- `PATCH /api/events/:id/volunteers/:vid` - Manage volunteer (EC/Admin)

### Notices
- `POST /api/notices` - Publish notice (EC/Admin)
- `GET /api/notices` - List active notices (Public)
- `GET /api/notices/:id` - Get notice details (Public)
- `PATCH /api/notices/:id` - Update notice (EC/Admin)

### Media
- `POST /api/media/upload` - Upload file (EC/Admin)
- `GET /api/media` - List all media (Public)
- `GET /api/media/:id/file` - Stream/download file (Public)

## Documentation

For complete integration guide, API documentation, and examples, see [INTEGRATION.md](./INTEGRATION.md)

## Architecture

```
ms3-event-notice-media/
├── src/
│   ├── config.js              # Environment configuration
│   ├── db.js                  # PostgreSQL connection
│   ├── index.js               # Express app
│   ├── middleware/            # Validation & RBAC
│   ├── queues/                # BullMQ setup
│   ├── repositories/          # Database queries
│   ├── services/              # Business logic
│   └── modules/               # Route handlers
│       ├── event/
│       ├── notice/
│       └── media/
├── migrations/                # Database schema
└── INTEGRATION.md             # Complete documentation
```

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL 16 (content schema)
- **Queue:** BullMQ + Redis
- **Validation:** Joi
- **File Upload:** Multer

## License

ISC
