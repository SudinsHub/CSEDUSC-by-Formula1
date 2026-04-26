# MS1-Auth Service — Frontend Integration Guide

> **Complete API reference and integration guide for the CSEDU Students' Club Authentication Service**

## Table of Contents

1. [Service Overview](#service-overview)
2. [Architecture & Flow](#architecture--flow)
3. [Authentication Endpoints](#authentication-endpoints)
4. [User Management Endpoints](#user-management-endpoints)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Token Management](#token-management)
8. [Security Best Practices](#security-best-practices)
9. [Integration Checklist](#integration-checklist)

---

## Service Overview

### Base Information

- **Service Name**: ms1-auth (Authentication & User Management Service)
- **Internal Port**: 3001
- **Access Method**: Through API Gateway at `http://localhost:4000`
- **Base Path**: `/api/auth` and `/api/users`
- **Protocol**: HTTP/JSON
- **Authentication**: JWT (JSON Web Tokens)

### Key Features

- User registration with email validation
- Secure login with bcrypt password hashing
- JWT-based authentication (access + refresh tokens)
- Role-based access control (RBAC)
- Password reset via email
- User profile management
- Admin user management (status & role updates)


### User Roles & Permissions

| Role | Description | Access Level |
|------|-------------|--------------|
| `PublicVisitor` | Unauthenticated users | Public content only |
| `GeneralStudent` | Registered students (default) | Basic features |
| `ECMember` | Executive Committee members | Elevated privileges |
| `Administrator` | System administrators | Full access |

### User Status States

| Status | Description | Can Login? |
|--------|-------------|------------|
| `PENDING` | Newly registered, awaiting approval | ❌ No |
| `ACTIVE` | Approved by admin | ✅ Yes |
| `REJECTED` | Registration rejected | ❌ No |
| `REVOKED` | Access revoked by admin | ❌ No |

---

## Architecture & Flow

### Request Flow Diagram

```
Frontend Application
        │
        │ HTTP Request (with JWT in Authorization header)
        ▼
API Gateway (Port 4000)
        │
        ├─ Verifies JWT signature
        ├─ Extracts userId & role from token
        ├─ Adds headers: x-user-id, x-user-role
        │
        ▼
MS1-Auth Service (Port 3001)
        │
        ├─ Validates request body (Zod schemas)
        ├─ Checks role permissions (requireRole middleware)
        ├─ Executes business logic
        ├─ Queries PostgreSQL database
        │
        ▼
Response (JSON)
```


### Authentication Flow

```
┌─────────────┐
│   REGISTER  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Status: PENDING     │ ◄── User cannot login yet
└──────┬──────────────┘
       │
       │ Admin approves
       ▼
┌─────────────────────┐
│ Status: ACTIVE      │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│    LOGIN    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Receive Tokens:             │
│ • accessToken (15 min)      │
│ • refreshToken (7 days)     │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Store tokens securely       │
│ (localStorage/sessionStorage│
│  or httpOnly cookies)       │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Include accessToken in      │
│ Authorization header for    │
│ all protected requests      │
└─────────────────────────────┘
```

---

## Authentication Endpoints

### 1. Register New User

**Endpoint**: `POST /api/auth/register`

**Access**: Public (no authentication required)

**Description**: Creates a new user account with `PENDING` status. Admin approval required before login.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@cs.du.ac.bd",
  "password": "SecurePass123!",
  "batch_year": 2021
}
```


**Validation Rules**:
- `name`: Minimum 2 characters
- `email`: Must be valid email ending with `@cs.du.ac.bd` or `@cse.du.ac.bd`
- `password`: Minimum 8 characters
- `batch_year`: 4-digit integer (e.g., 2021)

**Success Response** (201 Created):
```json
{
  "message": "Registration submitted. Awaiting admin approval."
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Validation failed | Invalid input format |
| 409 | Email already registered | Email exists in database |
| 500 | Internal server error | Server-side issue |

---

### 2. Login

**Endpoint**: `POST /api/auth/login`

**Access**: Public

**Description**: Authenticates user and returns JWT tokens.

**Request Body**:
```json
{
  "email": "john.doe@cs.du.ac.bd",
  "password": "SecurePass123!"
}
```

**Success Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john.doe@cs.du.ac.bd",
    "role": "GeneralStudent",
    "batch_year": 2021
  }
}
```


**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Validation failed | Missing or invalid email/password |
| 401 | Invalid credentials | Wrong email or password |
| 403 | Account is not active | User status is not ACTIVE |
| 500 | Internal server error | Server-side issue |

**Important Notes**:
- Error messages are intentionally vague for security (don't reveal if email exists)
- Only users with `status = ACTIVE` can login
- Tokens expire: accessToken (15 min), refreshToken (7 days)

---

### 3. Get Current User Profile

**Endpoint**: `GET /api/auth/me`

**Access**: Protected (requires authentication)

**Description**: Returns the profile of the currently authenticated user.

**Request Headers**:
```
Authorization: Bearer <accessToken>
```

**Success Response** (200 OK):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@cs.du.ac.bd",
  "role": "GeneralStudent",
  "status": "ACTIVE",
  "batch_year": 2021,
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Missing identity headers from gateway |
| 404 | User not found | User ID doesn't exist |
| 500 | Internal server error | Server-side issue |


---

### 4. Logout

**Endpoint**: `POST /api/auth/logout`

**Access**: Protected (requires authentication)

**Description**: Logs out the current user. Currently returns success immediately; token blacklisting will be added in future.

**Request Headers**:
```
Authorization: Bearer <accessToken>
```

**Success Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Frontend Action**: Clear stored tokens from localStorage/sessionStorage.

---

### 5. Forgot Password

**Endpoint**: `POST /api/auth/forgot-password`

**Access**: Public

**Description**: Sends a password reset email if the email exists and account is active. Always returns success to prevent email enumeration.

**Request Body**:
```json
{
  "email": "john.doe@cs.du.ac.bd"
}
```

**Success Response** (200 OK):
```json
{
  "message": "If that email is registered, a reset link has been sent."
}
```

**Email Content**:
- Contains a reset link: `{FRONTEND_URL}/reset-password?token={rawToken}`
- Token expires in 30 minutes
- One-time use only

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Validation failed | Invalid email format |
| 500 | Internal server error | Server-side issue |


---

### 6. Reset Password

**Endpoint**: `POST /api/auth/reset-password`

**Access**: Public

**Description**: Resets user password using the token from the email link.

**Request Body**:
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NewSecurePass456!"
}
```

**Validation Rules**:
- `token`: Required, non-empty string
- `newPassword`: Minimum 8 characters

**Success Response** (200 OK):
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Invalid or expired reset token | Token not found, already used, or expired |
| 400 | Validation failed | Invalid input format |
| 500 | Internal server error | Server-side issue |

**Important Notes**:
- Tokens expire after 30 minutes
- Each token can only be used once
- After successful reset, user must login with new password

---

## User Management Endpoints

### 7. List All Users (Admin Only)

**Endpoint**: `GET /api/users`

**Access**: Protected (Administrator role required)

**Description**: Returns paginated list of all users with optional filtering.

**Request Headers**:
```
Authorization: Bearer <accessToken>
```


**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (min: 1) |
| `limit` | integer | 20 | Items per page (min: 1, max: 100) |
| `status` | string | - | Filter by status: PENDING, ACTIVE, REJECTED, REVOKED |
| `role` | string | - | Filter by role: GeneralStudent, ECMember, Administrator |

**Example Request**:
```
GET /api/users?page=1&limit=20&status=PENDING&role=GeneralStudent
```

**Success Response** (200 OK):
```json
{
  "users": [
    {
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john.doe@cs.du.ac.bd",
      "role": "GeneralStudent",
      "status": "PENDING",
      "batch_year": 2021,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden: insufficient role | User is not Administrator |
| 500 | Internal server error | Server-side issue |


---

### 8. Get Single User (Admin Only)

**Endpoint**: `GET /api/users/:userId`

**Access**: Protected (Administrator role required)

**Description**: Returns detailed information about a specific user.

**Request Headers**:
```
Authorization: Bearer <accessToken>
```

**Example Request**:
```
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Success Response** (200 OK):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@cs.du.ac.bd",
  "role": "GeneralStudent",
  "status": "ACTIVE",
  "batch_year": 2021,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden: insufficient role | User is not Administrator |
| 404 | User not found | User ID doesn't exist |
| 500 | Internal server error | Server-side issue |

---

### 9. Update User Status (Admin Only)

**Endpoint**: `PATCH /api/users/:userId/status`

**Access**: Protected (Administrator role required)

**Description**: Updates a user's account status (approve/reject/revoke access).

**Request Headers**:
```
Authorization: Bearer <accessToken>
```


**Request Body**:
```json
{
  "status": "ACTIVE"
}
```

**Valid Status Values**:
- `ACTIVE` - Approve user (allows login)
- `REJECTED` - Reject registration
- `REVOKED` - Revoke access (blocks login)

**Success Response** (200 OK):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@cs.du.ac.bd",
  "role": "GeneralStudent",
  "status": "ACTIVE",
  "batch_year": 2021,
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Validation failed | Invalid status value |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden: insufficient role | User is not Administrator |
| 404 | User not found | User ID doesn't exist |
| 500 | Internal server error | Server-side issue |

**Use Cases**:
- Approve new registrations: `PENDING` → `ACTIVE`
- Reject suspicious registrations: `PENDING` → `REJECTED`
- Revoke access for violations: `ACTIVE` → `REVOKED`

---

### 10. Update User Role (Admin Only)

**Endpoint**: `PATCH /api/users/:userId/role`

**Access**: Protected (Administrator role required)

**Description**: Updates a user's role to grant elevated permissions.

**Request Headers**:
```
Authorization: Bearer <accessToken>
```


**Request Body**:
```json
{
  "role": "ECMember"
}
```

**Valid Role Values**:
- `ECMember` - Executive Committee member
- `Administrator` - Full system access

**Note**: Cannot set role to `GeneralStudent` via this endpoint (that's the default).

**Success Response** (200 OK):
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@cs.du.ac.bd",
  "role": "ECMember",
  "status": "ACTIVE",
  "batch_year": 2021,
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

**Error Responses**:

| Status | Error | Reason |
|--------|-------|--------|
| 400 | Validation failed | Invalid role value |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden: insufficient role | User is not Administrator |
| 404 | User not found | User ID doesn't exist |
| 500 | Internal server error | Server-side issue |

---

## Request/Response Examples

### Complete Registration Flow

```javascript
// 1. Register new user
const registerResponse = await fetch('http://localhost:4000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane.smith@cs.du.ac.bd',
    password: 'SecurePass123!',
    batch_year: 2022
  })
});

const registerData = await registerResponse.json();
// { message: "Registration submitted. Awaiting admin approval." }
```


```javascript
// 2. Admin approves the user (separate admin flow)
const approveResponse = await fetch(
  'http://localhost:4000/api/users/550e8400-e29b-41d4-a716-446655440000/status',
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminAccessToken}`
    },
    body: JSON.stringify({ status: 'ACTIVE' })
  }
);

// 3. User can now login
const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jane.smith@cs.du.ac.bd',
    password: 'SecurePass123!'
  })
});

const loginData = await loginResponse.json();
/*
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Smith",
    "email": "jane.smith@cs.du.ac.bd",
    "role": "GeneralStudent",
    "batch_year": 2022
  }
}
*/

// 4. Store tokens securely
localStorage.setItem('accessToken', loginData.accessToken);
localStorage.setItem('refreshToken', loginData.refreshToken);
localStorage.setItem('user', JSON.stringify(loginData.user));
```

---

### Making Authenticated Requests

```javascript
// Get current user profile
const accessToken = localStorage.getItem('accessToken');

const profileResponse = await fetch('http://localhost:4000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const profile = await profileResponse.json();
```


---

### Password Reset Flow

```javascript
// 1. User requests password reset
const forgotResponse = await fetch('http://localhost:4000/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'jane.smith@cs.du.ac.bd'
  })
});

// Always returns 200, even if email doesn't exist
// { message: "If that email is registered, a reset link has been sent." }

// 2. User receives email with link: 
//    http://localhost:5173/reset-password?token=a1b2c3d4e5f6...

// 3. Frontend extracts token from URL and submits new password
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

const resetResponse = await fetch('http://localhost:4000/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: token,
    newPassword: 'NewSecurePass456!'
  })
});

const resetData = await resetResponse.json();
// { message: "Password reset successfully" }

// 4. Redirect user to login page
```

---

### Admin User Management

```javascript
// List all pending users
const adminToken = localStorage.getItem('accessToken');

const usersResponse = await fetch(
  'http://localhost:4000/api/users?status=PENDING&page=1&limit=20',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);

const usersData = await usersResponse.json();
/*
{
  "users": [...],
  "total": 15,
  "page": 1,
  "limit": 20
}
*/
```


```javascript
// Approve a user
const approveResponse = await fetch(
  `http://localhost:4000/api/users/${userId}/status`,
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'ACTIVE' })
  }
);

// Promote user to EC Member
const promoteResponse = await fetch(
  `http://localhost:4000/api/users/${userId}/role`,
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ role: 'ECMember' })
  }
);
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message here"
}
```

For validation errors:

```json
{
  "error": "Validation failed",
  "details": [
    "Name must be at least 2 characters",
    "Email must be a @cs.du.ac.bd or @cse.du.ac.bd address"
  ]
}
```

### HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully (registration) |
| 400 | Bad Request | Invalid input or validation failed |
| 401 | Unauthorized | Missing, invalid, or expired token |
| 403 | Forbidden | Insufficient permissions or account not active |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate email) |
| 500 | Internal Server Error | Server-side issue |


### Error Handling Best Practices

```javascript
async function makeAuthRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific error cases
      switch (response.status) {
        case 401:
          // Token expired or invalid - redirect to login
          localStorage.clear();
          window.location.href = '/login';
          break;
          
        case 403:
          // Insufficient permissions
          if (data.error.includes('not active')) {
            alert('Your account is pending approval');
          } else {
            alert('You do not have permission to perform this action');
          }
          break;
          
        case 400:
          // Validation error - show details to user
          if (data.details) {
            alert('Validation errors:\n' + data.details.join('\n'));
          } else {
            alert(data.error);
          }
          break;
          
        case 409:
          // Conflict - email already exists
          alert('This email is already registered');
          break;
          
        default:
          alert(data.error || 'An error occurred');
      }
      
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

---

## Token Management

### Token Structure

Both `accessToken` and `refreshToken` are JWT tokens with this structure:

**Access Token Payload**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "GeneralStudent",
  "iat": 1705315800,
  "exp": 1705316700
}
```

**Refresh Token Payload**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1705315800,
  "exp": 1705920600
}
```


### Token Expiration

| Token Type | Lifespan | Purpose |
|------------|----------|---------|
| Access Token | 15 minutes | Used for API requests |
| Refresh Token | 7 days | Used to get new access tokens |

### Token Storage Options

**Option 1: localStorage (Simple, less secure)**
```javascript
// Store
localStorage.setItem('accessToken', token);

// Retrieve
const token = localStorage.getItem('accessToken');

// Clear on logout
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

**Option 2: sessionStorage (Cleared on tab close)**
```javascript
sessionStorage.setItem('accessToken', token);
```

**Option 3: httpOnly Cookies (Most secure, requires backend support)**
- Tokens stored in httpOnly cookies cannot be accessed by JavaScript
- Protects against XSS attacks
- Requires API Gateway to set cookies on login

### Token Refresh Strategy

```javascript
// Check if token is expired or about to expire
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Consider expired if less than 1 minute remaining
    return expiresAt - now < 60000;
  } catch (error) {
    return true;
  }
}

// Refresh token before making request
async function getValidAccessToken() {
  let accessToken = localStorage.getItem('accessToken');
  
  if (isTokenExpired(accessToken)) {
    const refreshToken = localStorage.getItem('refreshToken');
    
    // TODO: Call refresh endpoint when implemented
    // For now, redirect to login
    window.location.href = '/login';
    return null;
  }
  
  return accessToken;
}
```

**Note**: Token refresh endpoint is not yet implemented. When access token expires, users must login again.


---

## Security Best Practices

### 1. Password Requirements

Enforce these on the frontend before submission:
- Minimum 8 characters
- Mix of uppercase and lowercase letters (recommended)
- Include numbers and special characters (recommended)
- No common passwords (recommended)

```javascript
function validatePassword(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  // Optional: Add more checks
  if (!/[A-Z]/.test(password)) {
    return 'Password should contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password should contain at least one lowercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password should contain at least one number';
  }
  
  return null; // Valid
}
```

### 2. Email Validation

```javascript
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  
  if (!email.endsWith('@cs.du.ac.bd') && !email.endsWith('@cse.du.ac.bd')) {
    return 'Email must be a @cs.du.ac.bd or @cse.du.ac.bd address';
  }
  
  return null; // Valid
}
```

### 3. Secure Token Storage

**DO**:
- Store tokens in httpOnly cookies (if backend supports)
- Use sessionStorage for temporary sessions
- Clear tokens on logout
- Implement token refresh before expiration

**DON'T**:
- Store tokens in plain localStorage on production (XSS risk)
- Log tokens to console
- Send tokens in URL parameters
- Store tokens in cookies without httpOnly flag


### 4. HTTPS in Production

Always use HTTPS in production to prevent token interception:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.csedu.ac.bd'
  : 'http://localhost:4000';
```

### 5. CORS Configuration

The API Gateway should be configured to accept requests only from your frontend domain:
```javascript
// API Gateway CORS config (backend)
const allowedOrigins = [
  'http://localhost:5173',  // Development
  'https://csedu.ac.bd'     // Production
];
```

### 6. Rate Limiting

Be aware that the API Gateway implements rate limiting. Handle 429 (Too Many Requests) responses:
```javascript
if (response.status === 429) {
  alert('Too many requests. Please try again later.');
}
```

### 7. Input Sanitization

Always sanitize user input before displaying:
```javascript
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Usage
document.getElementById('username').textContent = sanitizeHTML(user.name);
```

---

## Integration Checklist

### Initial Setup

- [ ] Configure API Gateway base URL in environment variables
- [ ] Set up error handling utilities
- [ ] Implement token storage mechanism
- [ ] Create authentication context/state management
- [ ] Set up HTTP client with interceptors

### Registration Flow

- [ ] Create registration form with validation
- [ ] Implement email format validation (@cs.du.ac.bd or @cse.du.ac.bd)
- [ ] Implement password strength validation (min 8 chars)
- [ ] Handle success message (awaiting approval)
- [ ] Handle error cases (email exists, validation failed)
- [ ] Show appropriate user feedback


### Login Flow

- [ ] Create login form
- [ ] Store tokens securely on successful login
- [ ] Store user profile data
- [ ] Redirect to dashboard/home page
- [ ] Handle "account not active" error (show pending approval message)
- [ ] Handle invalid credentials error
- [ ] Implement "Remember me" functionality (optional)

### Authentication State

- [ ] Create auth context/provider
- [ ] Implement `isAuthenticated` check
- [ ] Implement `currentUser` state
- [ ] Create protected route wrapper
- [ ] Implement automatic token refresh (when endpoint available)
- [ ] Handle token expiration gracefully

### Logout Flow

- [ ] Clear all stored tokens
- [ ] Clear user profile data
- [ ] Redirect to login page
- [ ] Call logout endpoint

### Password Reset Flow

- [ ] Create "Forgot Password" form
- [ ] Create "Reset Password" page with token parameter
- [ ] Extract token from URL query parameter
- [ ] Validate new password before submission
- [ ] Handle expired/invalid token errors
- [ ] Redirect to login after successful reset

### User Profile

- [ ] Fetch and display current user profile
- [ ] Show user role and status
- [ ] Handle profile fetch errors
- [ ] Implement profile update (if needed)

### Admin Features

- [ ] Create admin dashboard
- [ ] Implement user list with pagination
- [ ] Add filters (status, role)
- [ ] Create user approval interface
- [ ] Implement role management interface
- [ ] Add confirmation dialogs for status/role changes
- [ ] Handle permission errors (403)


### Security

- [ ] Implement HTTPS in production
- [ ] Use httpOnly cookies for tokens (if supported)
- [ ] Implement CSRF protection (if using cookies)
- [ ] Sanitize all user-generated content before display
- [ ] Implement rate limiting on frontend (debounce requests)
- [ ] Add loading states to prevent double submissions
- [ ] Validate all inputs on frontend before API calls
- [ ] Never log sensitive data (tokens, passwords)

### Error Handling

- [ ] Create centralized error handler
- [ ] Display user-friendly error messages
- [ ] Log errors for debugging (without sensitive data)
- [ ] Handle network errors gracefully
- [ ] Implement retry logic for failed requests (optional)
- [ ] Show appropriate messages for each error type

### Testing

- [ ] Test registration with valid data
- [ ] Test registration with invalid email domain
- [ ] Test login with pending account
- [ ] Test login with active account
- [ ] Test login with wrong credentials
- [ ] Test protected routes without token
- [ ] Test protected routes with expired token
- [ ] Test admin features with non-admin account
- [ ] Test password reset flow end-to-end
- [ ] Test token expiration handling

---

## API Reference Summary

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Protected Endpoints (Requires Authentication)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/auth/me` | All | Get current user profile |
| POST | `/api/auth/logout` | All | Logout current user |
| GET | `/api/users` | Administrator | List all users |
| GET | `/api/users/:userId` | Administrator | Get single user |
| PATCH | `/api/users/:userId/status` | Administrator | Update user status |
| PATCH | `/api/users/:userId/role` | Administrator | Update user role |


---

## Common Integration Patterns

### React Authentication Context

```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const data = await response.json();
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      await fetch('http://localhost:4000/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    
    localStorage.clear();
    setUser(null);
  };

  const register = async (userData) => {
    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```


### Protected Route Component

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Usage in routes
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requiredRole="Administrator">
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

### API Client with Interceptors

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired - redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}

export const api = new APIClient('http://localhost:4000');

// Usage
const user = await api.get('/api/auth/me');
const result = await api.post('/api/auth/login', { email, password });
```


---

## Troubleshooting

### Common Issues

**Issue**: "Validation failed" on registration
- **Cause**: Email doesn't end with @cs.du.ac.bd or @cse.du.ac.bd
- **Solution**: Validate email format on frontend before submission

**Issue**: "Account is not active" on login
- **Cause**: User status is PENDING, REJECTED, or REVOKED
- **Solution**: Show message: "Your account is pending admin approval" or contact admin

**Issue**: "Invalid credentials" on login
- **Cause**: Wrong email or password, or email doesn't exist
- **Solution**: Check credentials, ensure caps lock is off

**Issue**: "Forbidden: missing identity headers"
- **Cause**: Request didn't go through API Gateway
- **Solution**: Always use gateway URL (http://localhost:4000), not direct service URL

**Issue**: "Forbidden: insufficient role"
- **Cause**: User doesn't have required role for the endpoint
- **Solution**: Check user role and hide/disable features they can't access

**Issue**: Token expired (401 Unauthorized)
- **Cause**: Access token expired after 15 minutes
- **Solution**: Implement token refresh or redirect to login

**Issue**: CORS errors
- **Cause**: API Gateway not configured to accept requests from your domain
- **Solution**: Configure CORS on API Gateway to allow your frontend origin

**Issue**: "Email already registered" (409)
- **Cause**: User trying to register with existing email
- **Solution**: Show message and provide "Forgot Password" link

---

## Database Schema Reference

### Users Table

```sql
CREATE TABLE users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'GeneralStudent',
  status        user_status NOT NULL DEFAULT 'PENDING',
  batch_year    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Enums**:
- `user_role`: GeneralStudent, ECMember, Administrator
- `user_status`: PENDING, ACTIVE, REJECTED, REVOKED


### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  token_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Environment Variables

### Required Backend Variables

```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/csedu_sc
JWT_SECRET=your_jwt_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="CSEDU Club <no-reply@csedu.ac.bd>"
FRONTEND_URL=http://localhost:5173
```

### Recommended Frontend Variables

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_APP_NAME=CSEDU Students' Club
```

---

## Support & Contact

For issues or questions about the authentication service:

1. Check this documentation first
2. Review the main README.md in the service folder
3. Check the API Gateway documentation
4. Contact the backend development team

---

## Changelog

### Version 1.0.0 (Current)

**Features**:
- User registration with email validation
- Login with JWT tokens (access + refresh)
- User profile retrieval
- Password reset via email
- Admin user management (status & role updates)
- Role-based access control

**Known Limitations**:
- Token refresh endpoint not yet implemented
- Logout doesn't invalidate tokens (planned: Redis blacklist)
- No email verification on registration (planned)
- No 2FA support (planned)

**Future Enhancements**:
- Token refresh endpoint
- Redis-backed token blacklist
- Email verification on registration
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub)
- User profile updates
- Account deletion

---

## Quick Reference Card

```
BASE URL: http://localhost:4000

PUBLIC ENDPOINTS:
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login and get tokens
POST   /api/auth/forgot-password   Request password reset
POST   /api/auth/reset-password    Reset password

PROTECTED ENDPOINTS (All Roles):
GET    /api/auth/me                Get current user
POST   /api/auth/logout            Logout

ADMIN ONLY:
GET    /api/users                  List users (paginated)
GET    /api/users/:id              Get single user
PATCH  /api/users/:id/status       Update user status
PATCH  /api/users/:id/role         Update user role

AUTHENTICATION:
Header: Authorization: Bearer <accessToken>

TOKEN LIFESPAN:
Access Token:  15 minutes
Refresh Token: 7 days

USER ROLES:
PublicVisitor, GeneralStudent, ECMember, Administrator

USER STATUSES:
PENDING (default), ACTIVE, REJECTED, REVOKED
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2024-01-15  
**Service Version**: ms1-auth v1.0.0
