# Creating Your First Admin and User

This guide explains how to create your first administrator and regular users in the CSEDU Students' Club Management System.

---

## Overview

The system has a two-step user creation process:
1. **Users register** through the API (status: PENDING)
2. **Admin approves** the registration (status: ACTIVE → user can login)

This creates a chicken-and-egg problem: you need an admin to approve users, but you need to create the first admin!

---

## Solution: Create First Admin Directly in Database

### Method 1: Using the Helper Script (Recommended)

We've created a script that automates the process:

```bash
# Make the script executable
chmod +x create-first-admin.sh

# Run it
./create-first-admin.sh
```

The script will:
1. Prompt you for admin details (name, email, password, batch year)
2. Hash the password using bcrypt
3. Insert the admin directly into the database with ACTIVE status
4. Display the credentials for login

### Method 2: Manual Database Insertion

If you prefer to do it manually:

#### Step 1: Start the Docker containers

```bash
docker compose up -d
```

#### Step 2: Access the PostgreSQL database

```bash
docker compose exec postgres psql -U formula1 -d csedu_sc
```

#### Step 3: Generate a password hash

First, you need to hash your password. You can use Node.js with bcrypt:

```bash
# From your host machine (requires Node.js and bcrypt installed)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123!', 12, (err, hash) => console.log(hash));"
```

Or use the ms1-auth container:

```bash
docker compose exec ms1-auth node -e "import bcrypt from 'bcrypt'; const hash = await bcrypt.hash('YourPassword123!', 12); console.log(hash);"
```

Copy the hash output (it will look like: `$2b$12$...`)

#### Step 4: Insert the admin user

In the PostgreSQL prompt:

```sql
INSERT INTO users (name, email, password_hash, role, status, batch_year)
VALUES (
  'Admin User',
  'admin@cs.du.ac.bd',
  '$2b$12$YOUR_HASHED_PASSWORD_HERE',
  'Administrator',
  'ACTIVE',
  2024
);
```

#### Step 5: Verify the admin was created

```sql
SELECT user_id, name, email, role, status FROM users WHERE role = 'Administrator';
```

#### Step 6: Exit PostgreSQL

```sql
\q
```

---

## Method 3: Using the API (After First Admin Exists)

Once you have your first admin, you can create additional users through the API:

### Step 1: User Registers

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@cs.du.ac.bd",
    "password": "SecurePass123!",
    "batch_year": 2021
  }'
```

Response:
```json
{
  "message": "Registration submitted. Awaiting admin approval."
}
```

### Step 2: Admin Logs In

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cs.du.ac.bd",
    "password": "YourPassword123!"
  }'
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Admin User",
    "email": "admin@cs.du.ac.bd",
    "role": "Administrator",
    "batch_year": 2024
  }
}
```

Save the `accessToken` for the next step.

### Step 3: Admin Lists Pending Users

```bash
curl -X GET "http://localhost:4000/api/users?status=PENDING" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

Response:
```json
{
  "users": [
    {
      "user_id": "abc-123-def-456",
      "name": "John Doe",
      "email": "john.doe@cs.du.ac.bd",
      "role": "GeneralStudent",
      "status": "PENDING",
      "batch_year": 2021,
      "created_at": "2026-04-16T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### Step 4: Admin Approves the User

```bash
curl -X PATCH "http://localhost:4000/api/users/abc-123-def-456/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACTIVE"
  }'
```

Response:
```json
{
  "user_id": "abc-123-def-456",
  "name": "John Doe",
  "email": "john.doe@cs.du.ac.bd",
  "role": "GeneralStudent",
  "status": "ACTIVE",
  "batch_year": 2021,
  "updated_at": "2026-04-16T11:00:00.000Z"
}
```

### Step 5: User Can Now Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@cs.du.ac.bd",
    "password": "SecurePass123!"
  }'
```

---

## User Roles Explained

| Role | Description | Permissions |
|------|-------------|-------------|
| `GeneralStudent` | Default role for all registered students | Basic access to events, elections, notices |
| `ECMember` | Executive Committee members | Can create/manage events, notices, elections |
| `Administrator` | System administrators | Full access including user management |

---

## Promoting Users to Higher Roles

Once a user is ACTIVE, an admin can promote them:

### Promote to EC Member

```bash
curl -X PATCH "http://localhost:4000/api/users/USER_ID_HERE/role" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ECMember"
  }'
```

### Promote to Administrator

```bash
curl -X PATCH "http://localhost:4000/api/users/USER_ID_HERE/role" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "Administrator"
  }'
```

---

## Testing with the Frontend

If you have the frontend running (http://localhost:5173):

1. **Register a new user**: Go to `/register`
2. **Login as admin**: Use the admin credentials you created
3. **Approve users**: Navigate to the admin dashboard
4. **Manage roles**: Promote users as needed

---

## Troubleshooting

### "Email already registered" error

Check if the email exists:
```bash
docker compose exec postgres psql -U formula1 -d csedu_sc -c "SELECT email, status FROM users WHERE email = 'admin@cs.du.ac.bd';"
```

Delete if needed:
```bash
docker compose exec postgres psql -U formula1 -d csedu_sc -c "DELETE FROM users WHERE email = 'admin@cs.du.ac.bd';"
```

### "Invalid credentials" error

- Verify the user status is ACTIVE
- Ensure the password hash was generated correctly
- Check that the email matches exactly

### Can't access admin endpoints

- Verify the user role is 'Administrator' (case-sensitive)
- Check that the JWT token is valid and not expired
- Ensure the API Gateway is forwarding the x-user-role header

---

## Security Best Practices

1. **Use strong passwords** for admin accounts (min 8 chars, mixed case, numbers, symbols)
2. **Change default credentials** immediately after first login
3. **Limit admin accounts** - only create what you need
4. **Use @cs.du.ac.bd or @cse.du.ac.bd emails** as required by the system
5. **Regularly audit** user accounts and permissions

---

## Quick Reference

### Email Requirements
- Must end with `@cs.du.ac.bd` or `@cse.du.ac.bd`
- Example: `admin@cs.du.ac.bd`, `student@cse.du.ac.bd`

### Password Requirements
- Minimum 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, and symbols

### User Status Flow
```
PENDING → ACTIVE (can login)
PENDING → REJECTED (cannot login)
ACTIVE → REVOKED (access removed)
```

### Default Ports
- API Gateway: http://localhost:4000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

**Need Help?** Check the full documentation:
- [ms1-auth/README.md](ms1-auth/README.md) - Authentication service details
- [ms1-auth/FRONTEND_INTEGRATION.md](ms1-auth/FRONTEND_INTEGRATION.md) - API reference
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Docker setup guide
