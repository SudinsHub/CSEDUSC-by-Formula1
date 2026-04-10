# API Gateway — CSEDU Students' Club Management System

This is the **single front door** of the entire backend.
Every request from the browser goes here first. The gateway
decides whether to allow or block it, then forwards it to
the correct microservice.

---

## Table of Contents

1. [What is an API Gateway?](#1-what-is-an-api-gateway)
2. [Project Structure](#2-project-structure)
3. [Getting Started for Teammates](#3-getting-started-for-teammates)
4. [How to Run](#4-how-to-run)
5. [File-by-File Code Explanation](#5-file-by-file-code-explanation)
   - [`.env` — Environment Variables](#env--environment-variables)
   - [`package.json` — Project Manifest](#packagejson--project-manifest)
   - [`src/config.js` — Configuration Loader](#srcconfigjs--configuration-loader)
   - [`src/index.js` — App Entry Point](#srcindexjs--app-entry-point)
   - [`src/middleware/verifyJWT.js` — Token Checker](#srcmiddlewareverifyjwtjs--token-checker)
   - [`src/middleware/rateLimiter.js` — Rate Limiters](#srcmiddlewareratelimiterjs--rate-limiters)
   - [`src/routes/proxy.js` — Route & Proxy Map](#srcroutesproxys--route--proxy-map)
6. [Request Lifecycle (Step by Step)](#6-request-lifecycle-step-by-step)
7. [HTTP Status Codes You Will See](#7-http-status-codes-you-will-see)
8. [How to Test](#8-how-to-test)

---

## 1. What is an API Gateway?

Imagine a hotel reception desk. Guests (browsers) never walk
directly into the kitchen, laundry, or staff room. They always
talk to the reception first. The reception:

- Checks if the guest is allowed in (authentication)
- Limits how many times the same guest can ring the bell (rate limiting)
- Directs them to the right department (proxying)

An **API Gateway** does exactly this for a web application.

```
Browser
  │
  ▼
┌─────────────────────────────────┐
│         API Gateway :4000        │
│  ┌──────────┐ ┌───────────────┐ │
│  │ verifyJWT│ │ Rate Limiters │ │
│  └──────────┘ └───────────────┘ │
└──────┬────────────┬─────────────┘
       │            │
  ┌────▼──┐    ┌────▼──┐   ┌───────┐   ┌───────┐
  │  MS1  │    │  MS2  │   │  MS3  │   │  MS4  │
  │ :3001 │    │ :3002 │   │ :3003 │   │ :3004 │
  │ Auth  │    │Election   │Events │   │Finance│
  └───────┘    └───────┘   └───────┘   └───────┘
```

The four microservices **never talk to the browser directly**.
They only receive requests that the gateway has already vetted.

---

## 2. Project Structure

```
api-gateway/
├── src/
│   ├── index.js              ← starts the server, wires everything together
│   ├── config.js             ← reads .env, crashes early if something is missing
│   ├── middleware/
│   │   ├── verifyJWT.js      ← checks if the user's token is valid
│   │   └── rateLimiter.js    ← limits how many requests per minute/IP
│   └── routes/
│       └── proxy.js          ← maps every URL path to the correct microservice
├── .env                      ← your secret settings (never commit this)
├── .env.example              ← template showing which settings are needed
├── test.html                 ← browser-based manual test tool
└── package.json              ← npm metadata and dependency list
```

---

## 3. Getting Started for Teammates

> You just cloned this repo and want to run the gateway locally.
> Follow these steps exactly — it takes about 2 minutes.

### Prerequisites (install once on your machine)

| Tool | Why you need it | Download |
|---|---|---|
| Node.js 18 or higher | Runs the gateway | https://nodejs.org (choose LTS) |
| npm | Installs packages (comes with Node) | included with Node |

To check you have the right version, open a terminal and run:
```bash
node --version   # should print v18.x.x or higher
npm --version    # should print 9.x.x or higher
```

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/<your-org>/api-gateway.git
cd api-gateway
```

Replace `<your-org>` with the actual GitHub username or
organisation name your teammate shared with you.

---

### Step 2 — Install dependencies

```bash
npm install
```

This reads `package.json` and downloads all the libraries into
a `node_modules/` folder. This folder is large (~20 MB) but it
is listed in `.gitignore` so it is never committed to Git —
every developer runs `npm install` to get their own copy.

---

### Step 3 — Create your `.env` file

The `.env` file holds secret configuration that is **not**
stored in Git (for security). You create it yourself from the
provided template:

```bash
cp .env.example .env
```

Then open `.env` in any text editor and fill in the values:

```
PORT=4000
JWT_SECRET=ask_your_team_lead_for_this_value
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5500
MS1_URL=http://localhost:3001
MS2_URL=http://localhost:3002
MS3_URL=http://localhost:3003
MS4_URL=http://localhost:3004
```

> **Important:** `JWT_SECRET` must be the **same value** across
> the gateway and all microservices. Ask your team lead for the
> agreed secret. If it differs, tokens signed by one service
> will be rejected by another.

---

### Step 4 — Start the gateway

```bash
PORT=4000 node src/index.js
```

You should see:
```
API Gateway listening on port 4000
```

Leave this terminal open. The gateway is now running.

---

### Step 5 — Verify it is working

Open a new terminal tab and run:

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","uptime":3.2}
```

If you see this, the gateway is ready. The `503` responses you
get when calling other routes (like `/api/auth/me`) are normal
— they just mean the microservices (MS1–MS4) are not running
yet on your machine.

---

### Step 6 — Test in the browser (optional)

```bash
npx serve . -p 5500
```

Then open **http://localhost:5500/test.html** in your browser.

Click **Generate & Sign Token** (make sure the JWT Secret field
matches your `.env`), then use the cards to send test requests
to the gateway.

---

### Common problems

| Problem | Cause | Fix |
|---|---|---|
| `Error: Missing required environment variables` | `.env` file is missing or incomplete | Re-do Step 3 |
| `EADDRINUSE: address already in use :::4000` | Port 4000 is taken by another process | Change `PORT=4000` to `PORT=4001` |
| `401 Unauthorized` on a protected route | JWT Secret in `.env` does not match the one used to sign the token | Make sure all teammates use the same `JWT_SECRET` |
| `Network error — Failed to fetch` in test page | CORS — the page origin is not in `FRONTEND_ORIGIN` | Add your origin (e.g. `http://localhost:5500`) to `FRONTEND_ORIGIN` in `.env` and restart |
| `503 Service unavailable` | The target microservice is not running | Start MS1–MS4 (normal during gateway-only development) |

---

## 4. How to Run (short version)

**Step 1 — Copy the environment file**
```bash
cp .env.example .env
```

**Step 2 — Install dependencies**
```bash
npm install express http-proxy-middleware jsonwebtoken express-rate-limit helmet cors morgan dotenv
```

**Step 3 — Start the gateway**
```bash
PORT=4000 node src/index.js
```

**Step 4 — Confirm it is running**
```bash
curl http://localhost:4000/health
# → {"status":"ok","uptime":3.2}
```

---

## 4. File-by-File Code Explanation

---

### `.env` — Environment Variables

```
PORT=3000
JWT_SECRET=your_jwt_secret_here
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5500
MS1_URL=http://localhost:3001
MS2_URL=http://localhost:3002
MS3_URL=http://localhost:3003
MS4_URL=http://localhost:3004
```

**What is a `.env` file?**

A `.env` file stores *configuration values* that change between
environments (your laptop vs. a production server) or that must
be kept secret (like `JWT_SECRET`). Instead of hardcoding these
values inside your code, you read them at runtime.

Think of it like a settings panel at the back of a TV — you
adjust it once and every part of the TV reads from it.

| Variable | What it does |
|---|---|
| `PORT` | Which port the gateway listens on |
| `JWT_SECRET` | The password used to sign and verify login tokens |
| `FRONTEND_ORIGIN` | Which websites are allowed to call this API (CORS whitelist) |
| `MS1_URL` … `MS4_URL` | The network address of each microservice |

**Important:** Never commit `.env` to Git. It contains secrets.
The `.env.example` file (which has no real secrets) is committed
instead so other developers know what variables they need.

---

### `package.json` — Project Manifest

```json
{
  "name": "api-gateway",
  "type": "module",
  ...
}
```

**What is `package.json`?**

Every Node.js project has one. It is like an ID card for your
project. The most important line here is:

```json
"type": "module"
```

This tells Node.js to treat all `.js` files as **ES Modules**,
which means you write:

```js
import express from 'express';   // ✅ ES Module style
```

instead of the older style:

```js
const express = require('express');  // ❌ CommonJS style (not used here)
```

---

### `src/config.js` — Configuration Loader

```js
import 'dotenv/config';

const required = ['JWT_SECRET', 'FRONTEND_ORIGIN', 'MS1_URL', ...];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}.`);
}

const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret: process.env.JWT_SECRET,
  ...
};

export default config;
```

**What does this file do?**

1. `import 'dotenv/config'` — reads your `.env` file and loads
   all the values into `process.env` (Node's built-in key-value
   store). After this line, `process.env.JWT_SECRET` works.

2. **Missing variable check** — it loops through a list of
   required variables. If any are missing, it *throws an error
   immediately and stops the server from starting*. This is
   intentional: a gateway running without a JWT secret would be
   a security hole.

   Example error you would see:
   ```
   Error: Missing required environment variables: JWT_SECRET, MS1_URL.
   ```

3. **Config object** — collects all values into one clean
   object. Every other file imports this object instead of
   reading `process.env` directly. This keeps things tidy.

4. `parseInt(..., 10)` — converts the PORT string `"3000"` to
   the number `3000`. The `?? '3000'` part means *"use 3000 if
   PORT is not set"*.

---

### `src/index.js` — App Entry Point

This is the **first file Node runs**. It creates the Express
app, attaches all middleware in the correct order, and starts
listening for requests.

```js
import config from './config.js';   // ← runs config.js first (validates env)
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { generalLimiter } from './middleware/rateLimiter.js';
import proxyRouter from './routes/proxy.js';
```

**Order of imports matters.** `config.js` is imported first
so that if a required env var is missing, the server crashes
with a clear message before anything else runs.

#### Middleware registered in order

```js
app.use(helmet());
```
`helmet` adds security-related HTTP response headers
automatically. For example it sets `X-Content-Type-Options`,
`X-Frame-Options`, etc. Think of it as putting a security
sticker on every response your server sends.

---

```js
const allowedOrigins = config.frontendOrigin.split(',').map(o => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);
```

**What is CORS?**

Browsers enforce a rule: JavaScript on `website-A.com` cannot
call an API on `website-B.com` unless `website-B.com` explicitly
says *"I allow website-A.com"*.

`config.frontendOrigin` contains a comma-separated string like:
```
http://localhost:5173,http://localhost:5500
```

`.split(',')` turns that into an array:
```js
['http://localhost:5173', 'http://localhost:5500']
```

The `origin` callback receives the caller's origin and checks
whether it is in the allowed list. If yes, `cb(null, true)`
means *allow*. If no, an error is passed to `cb`.

`credentials: true` allows the browser to send cookies along
with requests.

`!origin` handles non-browser tools like curl and Postman — they
don't send an `Origin` header at all, so we always let them
through.

---

```js
app.use(morgan('combined'));
```

`morgan` logs every request to the terminal. The `'combined'`
format prints a line like:

```
::1 - - [10/Apr/2026:09:28:26 +0000] "GET /health HTTP/1.1" 200 36 "-" "curl/8.7.1"
```

That tells you: who called, when, what path, the HTTP status
code (200), and what tool they used. Very useful for debugging.

---

```js
app.use(generalLimiter);
```

Applies the **general rate limiter** to every single request
(200 requests per minute per IP). This is the baseline
protection against abuse.

---

```js
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

A **health check endpoint**. It is handled entirely by the
gateway itself — it does not proxy to any microservice. Used
by deployment tools and monitoring systems to check if the
gateway is alive.

`process.uptime()` returns how many seconds Node has been
running.

The `_req` variable name (with an underscore) is a convention
meaning *"I receive this argument but I don't use it"*.

---

```js
app.use(proxyRouter);
```

Attaches all the proxy routes (defined in `routes/proxy.js`).

---

```js
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
```

This is the **fallback handler**. If a request reaches this
point, none of the routes above matched it. Express processes
middleware top-to-bottom, so this only fires as a last resort.

---

```js
app.listen(config.port, () => {
  console.log(`API Gateway listening on port ${config.port}`);
});
```

Starts the server. After this line runs, the gateway is open
for requests on the configured port.

---

### `src/middleware/verifyJWT.js` — Token Checker

```js
export function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
```

**What is a JWT?**

JWT stands for **JSON Web Token**. When a user logs in
successfully, the auth microservice creates a token that looks
like this:

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1LTEyMyIsInJvbGUiOiJzdHVkZW50In0.abc123
```

It has three parts separated by dots:
```
HEADER . PAYLOAD . SIGNATURE
```

- **Header** — algorithm used (HS256)
- **Payload** — the actual data (`userId`, `role`, expiry time)
- **Signature** — a cryptographic stamp that proves the token
  was created by someone who knows the `JWT_SECRET`

The browser stores this token and sends it with every future
request in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**What does `verifyJWT` do, step by step?**

1. Reads the `Authorization` header from the incoming request.

2. Checks it starts with `"Bearer "`. If not, immediately
   returns `401 Unauthorized` — the request stops here, it
   never reaches a microservice.

3. Strips the `"Bearer "` prefix (7 characters) to get just
   the raw token string.

4. Calls `jwt.verify(token, secret)` — this checks:
   - Is the signature valid? (was it really signed with our secret?)
   - Has the token expired?

   If valid, it returns the decoded payload (e.g.
   `{ userId: 'u-123', role: 'student' }`).

5. Saves `userId` and `role` onto the `req` object so the next
   step in the chain can access them.

6. Calls `next()` — meaning *"token is good, continue to the
   next middleware"*.

7. If `jwt.verify` throws any error (expired, tampered, wrong
   secret), the `catch` block returns `401`. Notice the error
   message is always the same generic `"Unauthorized"` — we
   never tell the caller whether their token was expired or
   forged, because that information could help an attacker.

**What is `next()`?**

Express middleware works like a chain of functions. Each
function receives the request, optionally does something, then
either:
- Calls `next()` to pass the request to the next function, OR
- Calls `res.json(...)` / `res.status(...).json(...)` to end
  the chain and send a response

```
Request → helmet → cors → morgan → generalLimiter → verifyJWT → proxy
                                                        ↓
                                               (if token invalid)
                                                  401 response
```

---

### `src/middleware/rateLimiter.js` — Rate Limiters

Rate limiting means: *"You can only make X requests in Y time.
After that, I will block you until the window resets."*

Three limiters are defined:

#### `generalLimiter`
```js
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 200,             // max 200 requests per IP per window
  ...
});
```
Applied globally to every route. A generous baseline that
stops only extreme abuse (e.g. a script hammering thousands
of requests per minute).

#### `authLimiter`
```js
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minute window
  max: 10,                    // max 10 login attempts per IP
  ...
});
```
Applied only to `POST /api/auth/login`. Much stricter because
login is the prime target for brute-force attacks (trying
thousands of passwords). After 10 failed attempts, the IP is
blocked for 15 minutes.

#### `voteLimiter`
```js
export const voteLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 20,              // max 20 vote requests per user per minute
  keyGenerator: (req) => req.headers['x-user-id'] ?? ipKeyGenerator(req),
  ...
});
```
Applied only to `POST /api/elections/*path`. Notice the
`keyGenerator` — by default rate limiters track by **IP
address**. But here we track by **user ID** instead. This is
important because:

- A university might have many students on the same IP
  (campus Wi-Fi, shared router)
- Tracking by IP would mean one student's votes could block
  another's

`x-user-id` is a header the gateway itself adds after
`verifyJWT` runs (see `proxy.js`). We use `ipKeyGenerator`
from the library as a safe fallback for IPv6 addresses.

**`standardHeaders: true`** — tells the library to include
standard rate limit info in the response headers:
```
RateLimit-Limit: 10
RateLimit-Remaining: 3
RateLimit-Reset: 1712745600
```
Your frontend can read these to show the user a countdown.

---

### `src/routes/proxy.js` — Route & Proxy Map

This file defines *which URL goes to which microservice* and
*which middleware runs before forwarding*.

#### The `proxyOptions` helper

```js
function proxyOptions(targetUrl) {
  return {
    target: targetUrl,
    changeOrigin: true,
    on: {
      proxyReq(proxyReq, req) {
        if (req.userId != null) {
          proxyReq.setHeader('x-user-id', req.userId);
        }
        if (req.userRole != null) {
          proxyReq.setHeader('x-user-role', req.userRole);
        }
      },
      error(_err, _req, res) {
        res.status(503).json({ error: 'Service unavailable' });
      },
    },
  };
}
```

This function is called once per route group to create the
proxy configuration.

- **`target`** — where to forward the request (e.g.
  `http://localhost:3001`)

- **`changeOrigin: true`** — rewrites the `Host` header on
  the outgoing request to match the target server. Without
  this some servers reject the request.

- **`on.proxyReq`** — a hook that runs *just before* the
  request is sent to the microservice. Here we add two custom
  headers:
  - `x-user-id` — the user's ID extracted from the JWT
  - `x-user-role` — the user's role (student, ec_member, etc.)

  Why? Because microservices need to know *who* is making the
  request (e.g. "only admins can do this") but they should
  not re-verify the JWT themselves — the gateway already did
  that. So the gateway passes the verified identity in trusted
  headers.

- **`on.error`** — if the microservice is unreachable (offline,
  crashed, wrong port) this hook catches the error and returns
  a clean `503 Service unavailable` instead of crashing the
  gateway or returning a confusing raw Node.js error.

#### Route definitions

Each line follows the pattern:

```js
router.METHOD('path', [...middleware], proxyMiddleware);
```

**Public route** (no login needed):
```js
router.post('/api/auth/register', createProxyMiddleware(proxyOptions(config.ms1Url)));
```
Request arrives → goes straight to MS1. No token check.

**Public route with strict rate limit:**
```js
router.post('/api/auth/login', authLimiter, createProxyMiddleware(proxyOptions(config.ms1Url)));
```
Request arrives → authLimiter checks the count → if ok, forwards to MS1.

**Protected route:**
```js
router.get('/api/auth/me', verifyJWT, createProxyMiddleware(proxyOptions(config.ms1Url)));
```
Request arrives → verifyJWT checks the token → if valid, forwards to MS1.

**Protected route with vote rate limit:**
```js
router.post('/api/elections/*path', verifyJWT, voteLimiter, createProxyMiddleware(proxyOptions(config.ms2Url)));
```
Request arrives → verifyJWT checks token (sets x-user-id) → voteLimiter checks count per user → forwards to MS2.

**Why `/*path` instead of `/*`?**

Express 5 (the version npm installed) uses a stricter URL
parser that requires wildcards to have a name. `/*path` means
*"match anything after this prefix and call it `path`"*. In
older Express 4 the unnamed `/*` worked fine, but Express 5
rejects it.

---

## 5. Request Lifecycle (Step by Step)

Let's trace what happens when a logged-in student visits
`GET /api/events/42` (a single event page):

```
1. Browser sends:
   GET /api/events/42
   Authorization: Bearer eyJhbGci...

2. helmet runs
   → adds security headers to the response

3. cors runs
   → checks Origin header is in the allowed list
   → adds Access-Control-Allow-Origin header

4. morgan runs
   → logs "GET /api/events/42" to terminal

5. generalLimiter runs
   → checks this IP hasn't exceeded 200 req/min
   → ok, continue

6. /health route — doesn't match, skip

7. proxy.js routes — checks each route top to bottom:
   router.get('/api/events', ...) — doesn't match (needs exact /api/events)
   router.get('/api/events/*path', ...) — MATCHES

8. No verifyJWT on this route (GET /api/events is public)
   → skip JWT check

9. createProxyMiddleware forwards the request to MS3 (:3003)
   → on.proxyReq runs: adds x-user-id and x-user-role headers
     (they will be empty since verifyJWT didn't run, which is fine)

10. MS3 receives:
    GET /api/events/42
    Host: localhost:3003

11. MS3 sends back the event data as JSON

12. Gateway forwards MS3's response back to the browser

Total time: a few milliseconds
```

---

## 6. HTTP Status Codes You Will See

| Code | Name | Meaning in this gateway |
|---|---|---|
| `200` | OK | Request succeeded |
| `401` | Unauthorized | Token missing, expired, or invalid |
| `404` | Not Found | No route matched the URL |
| `429` | Too Many Requests | Rate limiter blocked the request |
| `503` | Service Unavailable | Microservice is offline or unreachable |

---

## 7. How to Test

### Using the browser test page

1. Start the gateway: `PORT=4000 node src/index.js`
2. Start the static file server: `npx serve . -p 5500`
3. Open `http://localhost:5500/test.html`
4. Click **Generate & Sign Token** (make sure the JWT Secret
   matches your `.env`)
5. Use the cards to send requests

### Using curl (terminal)

```bash
# Health check
curl http://localhost:4000/health

# Protected route — no token (expect 401)
curl http://localhost:4000/api/auth/me

# Protected route — with token
TOKEN=$(node -e "
import jwt from 'jsonwebtoken';
console.log(jwt.sign({userId:'u-1',role:'student'},'your_jwt_secret_here'));
" --input-type=module)

curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/auth/me

# Rate limit test (fire 12 login requests, expect 429 on #11 and #12)
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "req $i → HTTP %{http_code}\n" \
    -X POST http://localhost:4000/api/auth/login
done
```
