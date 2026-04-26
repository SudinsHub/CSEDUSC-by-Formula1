# Quick Start: Creating Users

## TL;DR - Fastest Way

### 1. Start the system
```bash
docker compose up -d
```

### 2. Create first admin (Linux/Mac)
```bash
chmod +x create-first-admin.sh
./create-first-admin.sh
```

### 2. Create first admin (Windows)
```powershell
.\create-first-admin.ps1
```

### 3. Login as admin
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cs.du.ac.bd","password":"YourPassword"}'
```

### 4. Approve new users
```bash
# List pending users
curl http://localhost:4000/api/users?status=PENDING \
  -H "Authorization: Bearer YOUR_TOKEN"

# Approve a user
curl -X PATCH http://localhost:4000/api/users/USER_ID/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACTIVE"}'
```

---

## User Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER REGISTERS                                           │
│    POST /api/auth/register                                  │
│    Status: PENDING (cannot login yet)                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN APPROVES                                           │
│    PATCH /api/users/:id/status                              │
│    Status: PENDING → ACTIVE                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER CAN LOGIN                                           │
│    POST /api/auth/login                                     │
│    Receives: accessToken + refreshToken                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Commands

### Register a new user
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@cs.du.ac.bd",
    "password": "SecurePass123!",
    "batch_year": 2021
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@cs.du.ac.bd",
    "password": "SecurePass123!"
  }'
```

### Get current user profile
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List all users (admin only)
```bash
curl "http://localhost:4000/api/users?page=1&limit=20" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Approve user (admin only)
```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACTIVE"}'
```

### Promote to EC Member (admin only)
```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"ECMember"}'
```

### Promote to Administrator (admin only)
```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"Administrator"}'
```

---

## User Roles

| Role | Can Do |
|------|--------|
| **GeneralStudent** | View events, notices, participate in elections |
| **ECMember** | Everything above + create/manage events, notices, elections |
| **Administrator** | Everything above + manage users, approve registrations |

---

## User Status

| Status | Can Login? | Meaning |
|--------|-----------|---------|
| **PENDING** | ❌ No | Awaiting admin approval |
| **ACTIVE** | ✅ Yes | Approved and active |
| **REJECTED** | ❌ No | Registration rejected |
| **REVOKED** | ❌ No | Access revoked by admin |

---

## Email Requirements

✅ Valid:
- `student@cs.du.ac.bd`
- `admin@cse.du.ac.bd`

❌ Invalid:
- `student@gmail.com`
- `admin@du.ac.bd`
- `user@example.com`

---

## Password Requirements

- Minimum 8 characters
- Recommended: Mix of uppercase, lowercase, numbers, symbols

---

## Troubleshooting

### "Email already registered"
```bash
# Check if user exists
docker compose exec postgres psql -U formula1 -d csedu_sc \
  -c "SELECT email, status FROM users WHERE email = 'user@cs.du.ac.bd';"

# Delete if needed
docker compose exec postgres psql -U formula1 -d csedu_sc \
  -c "DELETE FROM users WHERE email = 'user@cs.du.ac.bd';"
```

### "Account is not active"
User status is not ACTIVE. Admin needs to approve:
```bash
curl -X PATCH http://localhost:4000/api/users/USER_ID/status \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACTIVE"}'
```

### "Invalid credentials"
- Check email is correct
- Check password is correct
- Verify user status is ACTIVE

### Can't access admin endpoints
- Verify user role is 'Administrator'
- Check JWT token is valid
- Ensure token is in Authorization header: `Bearer YOUR_TOKEN`

---

## Manual Database Access

### Connect to database
```bash
docker compose exec postgres psql -U formula1 -d csedu_sc
```

### Useful queries
```sql
-- List all users
SELECT user_id, name, email, role, status FROM users;

-- List pending users
SELECT user_id, name, email FROM users WHERE status = 'PENDING';

-- List admins
SELECT user_id, name, email FROM users WHERE role = 'Administrator';

-- Approve a user
UPDATE users SET status = 'ACTIVE' WHERE email = 'user@cs.du.ac.bd';

-- Promote to admin
UPDATE users SET role = 'Administrator' WHERE email = 'user@cs.du.ac.bd';

-- Delete a user
DELETE FROM users WHERE email = 'user@cs.du.ac.bd';
```

---

## Need More Help?

- Full guide: [CREATE_FIRST_ADMIN.md](CREATE_FIRST_ADMIN.md)
- Auth service docs: [ms1-auth/README.md](ms1-auth/README.md)
- API reference: [ms1-auth/FRONTEND_INTEGRATION.md](ms1-auth/FRONTEND_INTEGRATION.md)
- Docker setup: [DOCKER_SETUP.md](DOCKER_SETUP.md)
