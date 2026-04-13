# ms1-auth — Authentication Service

This service handles everything related to users: registration, login, logout, "who am I?", and password reset. It runs on **port 3001** and is reached through the API Gateway — users never talk to it directly.

---

## How a request travels through the code

Think of each request as a package being delivered. It goes through several checkpoints before it reaches its destination.

```
HTTP Request
     │
     ▼
 index.js          ← starts the server, wires up routes
     │
     ▼
 auth.routes.js    ← decides WHICH function handles this URL
     │
     ├── validate() middleware   ← checks the request body is correct
     ├── requireRole() middleware ← checks the user is logged in (on protected routes)
     │
     ▼
 auth.controller.js  ← receives the request, calls the service, sends the response
     │
     ▼
 auth.service.js     ← the real logic: database queries, password hashing, JWT creation
```

---

## The files explained

### `src/index.js` — The front door

This is where the server starts. It does three things:

1. Loads `config.js` (reads your `.env` file and crashes early if something is missing)
2. Mounts the routes under `/api/auth` and `/api/users`
3. Calls `app.listen(3001)` to start accepting requests

```
GET  /health        → always works, no login needed (used to check if server is alive)
/api/auth/...       → everything in auth.routes.js
/api/users/...      → everything in users.routes.js
```

---

### `src/config.js` — Settings and secrets

Reads your `.env` file and exports one `config` object the rest of the app uses.

It also **crashes on startup** if any required variable is missing. This is intentional — better to fail immediately than to fail mysteriously later.

```js
// Example of what it exports:
config.jwt.secret        // "csedusc_dev_secret_2024"
config.jwt.accessExpires // "15m"
config.smtp.host         // "smtp.gmail.com"
```

---

### `src/modules/auth/auth.routes.js` — The URL map

This file just maps URLs to functions. Nothing else.

| Method | URL | Middleware | Handler |
|--------|-----|------------|---------|
| POST | `/api/auth/register` | validate(registerSchema) | `register` |
| POST | `/api/auth/login` | validate(loginSchema) | `login` |
| POST | `/api/auth/logout` | requireRole(...) | `logout` |
| GET | `/api/auth/me` | requireRole(...) | `me` |
| POST | `/api/auth/forgot-password` | validate(...) | `forgotPassword` |
| POST | `/api/auth/reset-password` | validate(...) | `resetPassword` |

The two middlewares listed there are gates — the request only reaches the handler if it passes them first.

---

### `src/middleware/validate.js` — Input checking

Before any logic runs, this middleware checks that the request body has the right fields and the right format.

**How it works:**

1. Takes a Zod schema as its argument (e.g. `registerSchema`)
2. Runs `schema.safeParse(req.body)` — Zod checks every field
3. If anything is wrong → stops the request immediately and returns `400 Validation failed`
4. If everything is fine → passes the cleaned data to the next step

```
POST /api/auth/register  { "name": "walid", "email": "walid@cs.du.ac.bd", "password22": "..." }
                                                                                   ↑
                                                          TYPO — validate() catches this, returns 400
```

---

### `src/modules/auth/auth.schema.js` — What "valid" means

This is where the rules for each request body are defined using **Zod** (a validation library).

**Register rules:**
- `name` — string, at least 2 characters
- `email` — must be a valid email AND end with `@cs.du.ac.bd` or `@cse.du.ac.bd`
- `password` — string, at least 8 characters
- `batch_year` — a 4-digit number (e.g. `2021`)

**Login rules:**
- `email` — valid email format
- `password` — any non-empty string

If a field is listed in the schema but missing from the body, Zod returns `"Required"` — which is exactly what you saw in the 400 error.

---

### `src/middleware/requireRole.js` — "Are you logged in?"

This gate protects routes like `/me` and `/logout`. It does **not** verify a JWT itself — that job belongs to the API Gateway. By the time a request reaches ms1-auth, the gateway has already verified the token and added two headers:

```
x-user-id:   "user-123"
x-user-role: "GeneralStudent"
```

`requireRole` reads those headers and:
- Returns `403` if the headers are missing (request didn't come through the gateway)
- Returns `403` if the user's role is not in the allowed list
- Otherwise attaches `req.userId` and `req.userRole` and lets the request through

---

### `src/modules/auth/auth.controller.js` — Traffic coordinator

The controller is the function that Express calls when a request arrives. Its only job is:

1. Call the right **service** function
2. Send back the HTTP response (status code + JSON body)
3. Catch errors and return the right error response

Controllers do not contain business logic — they just coordinate.

```js
export const login = async (req, res) => {
  const result = await authService.login(req.body); // call the service
  res.status(200).json(result);                     // send the response
};
```

---

### `src/modules/auth/auth.service.js` — The actual logic

This is where the real work happens. Each function talks to the database (via `db.js`).

#### `register({ name, email, password, batch_year })`

1. Check if the email already exists in the `users` table → `409 Conflict` if yes
2. Hash the password with bcrypt (12 rounds — slow on purpose, makes brute-force expensive)
3. Insert the new user row into the database
4. The account starts with `status = PENDING` — an admin must approve it before the user can log in

#### `login({ email, password })`

1. Find the user by email
2. If not found → `401 Invalid credentials` (deliberately vague — don't reveal whether the email exists)
3. If `status` is not `ACTIVE` → `403 Account is not active`
4. Compare the submitted password against the stored hash using `bcrypt.compare`
5. If wrong → `401 Invalid credentials`
6. If correct → create two JWT tokens and return them

**What are the two tokens?**

| Token | Expires | Purpose |
|-------|---------|---------|
| `accessToken` | 15 minutes | Sent with every request in the `Authorization` header |
| `refreshToken` | 7 days | Used only to get a new access token when it expires |

Both are signed with `JWT_SECRET` from your `.env`. Signing means the gateway can verify they haven't been tampered with — without asking the database.

#### `getMe(userId)`

Receives the `userId` that `requireRole` pulled from the `x-user-id` header and returns that user's profile from the database.

#### `forgotPassword(email)`

1. Look up the user — if not found, do nothing (but always respond with `200` so attackers can't enumerate emails)
2. Generate a random 32-byte token with Node's `crypto` module
3. Hash that token and store the hash in `password_reset_tokens` table (expires in 30 minutes)
4. Send an email with the raw token embedded in a reset link

The raw token is never stored — only its hash. If the database leaks, the tokens are useless.

#### `resetPassword({ token, newPassword })`

1. Hash the submitted token and look it up in `password_reset_tokens`
2. If not found, already used, or expired → `400 Invalid or expired reset token`
3. Hash the new password with bcrypt and update the user row
4. Mark the reset token as `used = TRUE` so it can't be used again

---

## The full register flow, step by step

```
Browser / test.html
      │
      │  POST /api/auth/register
      │  Body: { name, email, password, batch_year }
      │
      ▼
API Gateway (port 4000)
      │  (this route is public — no JWT check, just forwards the request)
      │
      ▼
ms1-auth (port 3001)
      │
      ├─ 1. auth.routes.js matches POST /register
      │
      ├─ 2. validate(registerSchema) runs
      │       ✗ bad body  →  400 Validation failed  (stops here)
      │       ✓ good body →  continues
      │
      ├─ 3. auth.controller.register() is called
      │
      ├─ 4. auth.service.register() runs
      │       ✗ email exists  →  409 Conflict  (stops here)
      │       ✓ new email
      │             → bcrypt hashes the password
      │             → INSERT INTO users ...
      │
      └─ 5. Controller sends:  201 { message: "Registration submitted. Awaiting admin approval." }
```

---

## The full login flow, step by step

```
Browser / test.html
      │
      │  POST /api/auth/login
      │  Body: { email, password }
      │
      ▼
API Gateway → ms1-auth
      │
      ├─ 1. validate(loginSchema) — checks email format and password not empty
      │
      ├─ 2. auth.service.login()
      │       → SELECT user FROM db WHERE email = ?
      │       → check status === 'ACTIVE'
      │       → bcrypt.compare(password, hash)
      │       → jwt.sign(...)  creates accessToken + refreshToken
      │
      └─ 3. 200 { accessToken, refreshToken, user: { ... } }
```

---

## The full "who am I?" flow, step by step

```
Browser / test.html
      │
      │  GET /api/auth/me
      │  Headers: { Authorization: "Bearer <accessToken>" }
      │
      ▼
API Gateway (port 4000)
      │  → verifies the JWT signature using JWT_SECRET
      │  → extracts userId and role from the token
      │  → adds headers:  x-user-id: "..."   x-user-role: "..."
      │  → forwards the request to ms1-auth
      │
      ▼
ms1-auth (port 3001)
      │
      ├─ 1. requireRole(['PublicVisitor', 'GeneralStudent', ...]) runs
      │       ✗ missing headers  →  403 Forbidden
      │       ✓ headers present  →  attaches req.userId
      │
      ├─ 2. auth.service.getMe(req.userId)
      │       → SELECT user FROM db WHERE user_id = ?
      │
      └─ 3. 200 { userId, name, email, role, status, batch_year, created_at }
```

---

## Key concepts summarised

| Concept | What it means here |
|---------|-------------------|
| **Middleware** | A function that runs before your route handler. Can stop the request or pass it on. |
| **Zod** | A library that checks if an object has the right shape and types. |
| **bcrypt** | Turns a plain password into a fixed-length hash. Cannot be reversed. Used so plain passwords are never stored. |
| **JWT** | A signed token the server gives you after login. You send it with future requests to prove who you are. |
| **accessToken** | Short-lived (15 min). Used for every protected request. |
| **refreshToken** | Long-lived (7 days). Used only to get a fresh access token. |
| **x-user-id / x-user-role** | Headers the API Gateway adds after verifying the JWT. ms1-auth trusts them completely. |
| **status: PENDING** | New accounts wait for an admin to flip them to `ACTIVE` before they can log in. |