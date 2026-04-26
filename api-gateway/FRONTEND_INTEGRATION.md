# API Gateway — Frontend Integration Guide

> Complete reference for frontend developers integrating with the CSEDU Students' Club Management System

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Base Configuration](#base-configuration)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints Reference](#api-endpoints-reference)
5. [Request/Response Patterns](#requestresponse-patterns)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security Best Practices](#security-best-practices)
9. [Testing & Debugging](#testing--debugging)
10. [Common Integration Patterns](#common-integration-patterns)

---

## Quick Start

### Prerequisites

- API Gateway running on `http://localhost:4000` (or your configured URL)
- Modern browser with fetch API support
- Understanding of JWT-based authentication

### Minimal Working Example

```javascript
// 1. Login
const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 2. Store token
localStorage.setItem('authToken', token);

// 3. Make authenticated request
const profileResponse = await fetch('http://localhost:4000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const profile = await profileResponse.json();
console.log(profile);
```

---

## Base Configuration

### Environment Variables

Create a `.env` file in your frontend project:

```env
VITE_API_BASE_URL=http://localhost:4000
# or for production
VITE_API_BASE_URL=https://api.yourdomain.com
```

### API Client Setup

```javascript
// src/api/client.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add auth token if available
    if (token && !options.skipAuth) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, config);

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    // Handle auth errors
    if (response.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

---

## Authentication Flow

### Complete Auth Workflow

```javascript
// src/api/auth.js
import { apiClient } from './client.js';

export const authService = {
  // Register new user
  async register(userData) {
    const response = await apiClient.post('/api/auth/register', userData, { skipAuth: true });
    return response;
  },

  // Login
  async login(email, password) {
    const response = await apiClient.post('/api/auth/login', { email, password }, { skipAuth: true });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
    }
    return response;
  },

  // Logout
  async logout() {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  },

  // Get current user profile
  async getProfile() {
    return apiClient.get('/api/auth/me');
  },

  // Forgot password
  async forgotPassword(email) {
    return apiClient.post('/api/auth/forgot-password', { email }, { skipAuth: true });
  },

  // Reset password
  async resetPassword(token, newPassword) {
    return apiClient.post('/api/auth/reset-password', { token, newPassword }, { skipAuth: true });
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },
};
```

### React Authentication Hook

```javascript
// src/hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { authService } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user on mount
    if (authService.isAuthenticated()) {
      authService.getProfile()
        .then(setUser)
        .catch(() => localStorage.removeItem('authToken'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const profile = await authService.getProfile();
    setUser(profile);
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Route Component

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ children, requiredRole }) {
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
}
```

---

## API Endpoints Reference

### MS1 — Authentication & User Management

#### Public Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Register new user | 200/min (general) |
| POST | `/api/auth/login` | Login user | 10/15min (strict) |
| POST | `/api/auth/forgot-password` | Request password reset | 200/min (general) |
| POST | `/api/auth/reset-password` | Reset password with token | 200/min (general) |

#### Protected Endpoints (Requires JWT)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | `/api/auth/logout` | Logout current user | Any authenticated |
| GET | `/api/auth/me` | Get current user profile | Any authenticated |
| GET | `/api/users` | List all users | Admin/EC Member |
| GET | `/api/users/:id` | Get user by ID | Admin/EC Member |
| PATCH | `/api/users/:id` | Update user | Admin/EC Member |

**Example: Register**
```javascript
const response = await apiClient.post('/api/auth/register', {
  email: 'student@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  studentId: '2021-1-60-001',
  role: 'student'
});
// Response: { message: 'User registered successfully', userId: 'u-123' }
```

**Example: Get Profile**
```javascript
const profile = await apiClient.get('/api/auth/me');
// Response: { userId: 'u-123', email: '...', name: '...', role: 'student' }
```

---

### MS2 — Elections

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/elections` | List all elections |
| GET | `/api/elections/:id` | Get election details |
| GET | `/api/elections/:id/candidates` | List candidates |
| GET | `/api/elections/:id/results` | Get election results (if published) |

#### Protected Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/elections/:id/vote` | Cast a vote | 20/min per user |
| POST | `/api/elections` | Create election | Admin only |
| PATCH | `/api/elections/:id` | Update election | Admin only |
| POST | `/api/elections/:id/candidates` | Add candidate | Admin only |

**Example: List Elections**
```javascript
const elections = await apiClient.get('/api/elections');
// Response: [{ id: 'e-1', title: 'EC Election 2026', status: 'active', ... }]
```

**Example: Cast Vote**
```javascript
const result = await apiClient.post('/api/elections/e-1/vote', {
  candidateId: 'c-42'
});
// Response: { message: 'Vote recorded successfully', voteId: 'v-789' }
```

---

### MS3 — Events & Notices

#### Events

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | List all events | No |
| GET | `/api/events/:id` | Get event details | No |
| POST | `/api/events` | Create event | Yes (EC Member) |
| PATCH | `/api/events/:id` | Update event | Yes (EC Member) |
| DELETE | `/api/events/:id` | Delete event | Yes (EC Member) |
| POST | `/api/events/:id/register` | Register for event | Yes (Any) |

#### Notices

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notices` | List all notices | No |
| GET | `/api/notices/:id` | Get notice details | No |
| POST | `/api/notices` | Create notice | Yes (EC Member) |

**Example: List Events**
```javascript
const events = await apiClient.get('/api/events?status=upcoming');
// Response: [{ id: 'ev-1', title: 'Tech Talk', date: '2026-05-01', ... }]
```

**Example: Register for Event**
```javascript
const registration = await apiClient.post('/api/events/ev-1/register');
// Response: { message: 'Registered successfully', registrationId: 'r-456' }
```

---

### MS4 — Finance, Notifications & Logs

#### Finance (All Protected)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/finance/transactions` | List transactions | EC Member |
| GET | `/api/finance/budget` | Get budget info | EC Member |
| POST | `/api/finance/transactions` | Record transaction | Treasurer |

#### Logs (All Protected)

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| GET | `/api/logs` | List audit logs | Admin |
| GET | `/api/logs/:id` | Get log details | Admin |

**Example: Get Transactions**
```javascript
const transactions = await apiClient.get('/api/finance/transactions?month=2026-04');
// Response: [{ id: 't-1', amount: 5000, type: 'income', ... }]
```

---

## Request/Response Patterns

### Standard Response Format

All microservices follow consistent response patterns:

**Success Response**
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response**
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning | When You'll See It |
|------|---------|-------------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 503 | Service Unavailable | Microservice is down |

### Pagination

For list endpoints that return many items:

```javascript
// Request with pagination
const response = await apiClient.get('/api/events?page=2&limit=10');

// Response structure
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Filtering & Sorting

```javascript
// Filter by status
await apiClient.get('/api/elections?status=active');

// Sort by date
await apiClient.get('/api/events?sort=date&order=desc');

// Combine filters
await apiClient.get('/api/events?status=upcoming&category=workshop&sort=date');
```

---

## Error Handling

### Comprehensive Error Handler

```javascript
// src/utils/errorHandler.js
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }
}

export function handleApiError(error) {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        return 'Please login to continue';
      
      case 403:
        return 'You do not have permission to perform this action';
      
      case 404:
        return 'The requested resource was not found';
      
      case 429:
        return 'Too many requests. Please slow down and try again later';
      
      case 503:
        return 'Service temporarily unavailable. Please try again later';
      
      default:
        return error.message || 'An unexpected error occurred';
    }
  }
  
  return 'Network error. Please check your connection';
}
```

### React Error Boundary

```javascript
// src/components/ErrorBoundary.jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Usage in Components

```javascript
// Example: Login form with error handling
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { handleApiError } from '../utils/errorHandler';

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      await login(formData.get('email'), formData.get('password'));
      // Redirect handled by AuthProvider
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Rate Limiting

### Understanding Rate Limits

The API Gateway implements three types of rate limiting:

#### 1. General Rate Limit
- **Limit:** 200 requests per minute per IP
- **Applies to:** All endpoints
- **Purpose:** Baseline protection against abuse

#### 2. Auth Rate Limit
- **Limit:** 10 requests per 15 minutes per IP
- **Applies to:** `POST /api/auth/login`
- **Purpose:** Prevent brute-force password attacks

#### 3. Vote Rate Limit
- **Limit:** 20 requests per minute per user
- **Applies to:** `POST /api/elections/*`
- **Purpose:** Prevent vote manipulation

### Reading Rate Limit Headers

```javascript
async function makeRequest(url) {
  const response = await fetch(url);
  
  // Read rate limit info from headers
  const limit = response.headers.get('RateLimit-Limit');
  const remaining = response.headers.get('RateLimit-Remaining');
  const reset = response.headers.get('RateLimit-Reset');
  
  console.log(`Rate limit: ${remaining}/${limit} remaining`);
  console.log(`Resets at: ${new Date(reset * 1000).toLocaleString()}`);
  
  return response.json();
}
```

### Handling Rate Limit Errors

```javascript
// src/utils/rateLimitHandler.js
export async function requestWithRetry(requestFn, maxRetries = 3) {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.message.includes('Rate limited')) {
        attempt++;
        
        // Extract retry-after seconds from error message
        const match = error.message.match(/(\d+) seconds/);
        const retryAfter = match ? parseInt(match[1]) : 60;
        
        if (attempt < maxRetries) {
          console.log(`Rate limited. Retrying in ${retryAfter} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
      } else {
        throw error;
      }
    }
  }
}
```

### UI Rate Limit Indicator

```javascript
// src/components/RateLimitIndicator.jsx
import { useState, useEffect } from 'react';

export function RateLimitIndicator({ endpoint }) {
  const [rateInfo, setRateInfo] = useState(null);

  useEffect(() => {
    const checkRateLimit = async () => {
      try {
        const response = await fetch(endpoint, { method: 'HEAD' });
        setRateInfo({
          limit: response.headers.get('RateLimit-Limit'),
          remaining: response.headers.get('RateLimit-Remaining'),
          reset: response.headers.get('RateLimit-Reset'),
        });
      } catch (error) {
        console.error('Failed to check rate limit:', error);
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, [endpoint]);

  if (!rateInfo) return null;

  const percentage = (rateInfo.remaining / rateInfo.limit) * 100;
  const resetTime = new Date(rateInfo.reset * 1000);

  return (
    <div className="rate-limit-indicator">
      <div className="progress-bar" style={{ width: `${percentage}%` }} />
      <span>
        {rateInfo.remaining}/{rateInfo.limit} requests remaining
        (resets at {resetTime.toLocaleTimeString()})
      </span>
    </div>
  );
}
```

---

## Security Best Practices

### Token Storage

**✅ DO:**
```javascript
// Store in localStorage for web apps
localStorage.setItem('authToken', token);

// Or use sessionStorage for more security (cleared on tab close)
sessionStorage.setItem('authToken', token);

// For mobile apps, use secure storage
// - React Native: @react-native-async-storage/async-storage
// - Expo: expo-secure-store
```

**❌ DON'T:**
```javascript
// Never store in cookies without httpOnly flag (XSS vulnerable)
document.cookie = `token=${token}`;

// Never expose in URL
window.location.href = `/dashboard?token=${token}`;

// Never log tokens
console.log('Token:', token);
```

### CORS Configuration

The gateway only accepts requests from whitelisted origins. Ensure your frontend origin is added to the gateway's `.env`:

```env
FRONTEND_ORIGIN=http://localhost:5173,https://yourdomain.com
```

### HTTPS in Production

**Always use HTTPS in production:**

```javascript
// config.js
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.yourdomain.com'
  : 'http://localhost:4000';
```

### Input Validation

**Always validate user input before sending:**

```javascript
// src/utils/validation.js
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
}

// Usage in form
const handleSubmit = (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  if (!validateEmail(email)) {
    setError('Invalid email format');
    return;
  }

  if (!validatePassword(password)) {
    setError('Password must be at least 8 characters with uppercase, lowercase, and number');
    return;
  }

  // Proceed with API call
  authService.login(email, password);
};
```

### XSS Prevention

```javascript
// Always sanitize user-generated content before rendering
import DOMPurify from 'dompurify';

function UserComment({ comment }) {
  const sanitized = DOMPurify.sanitize(comment.text);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### Token Expiration Handling

```javascript
// src/utils/tokenManager.js
import { jwtDecode } from 'jwt-decode';

export function isTokenExpired(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function getTokenExpiryTime(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000;
  } catch {
    return null;
  }
}

// Auto-logout before token expires
export function setupAutoLogout(token, logoutCallback) {
  const expiryTime = getTokenExpiryTime(token);
  if (!expiryTime) return;

  const timeUntilExpiry = expiryTime - Date.now();
  const logoutTime = timeUntilExpiry - 60000; // Logout 1 minute before expiry

  if (logoutTime > 0) {
    setTimeout(() => {
      alert('Your session is about to expire. Please login again.');
      logoutCallback();
    }, logoutTime);
  }
}
```

---

## Testing & Debugging

### Health Check

Always verify the gateway is running:

```javascript
// src/utils/healthCheck.js
export async function checkApiHealth() {
  try {
    const response = await fetch('http://localhost:4000/health');
    const data = await response.json();
    console.log('API Gateway is healthy:', data);
    return true;
  } catch (error) {
    console.error('API Gateway is down:', error);
    return false;
  }
}

// Use in app initialization
useEffect(() => {
  checkApiHealth().then(isHealthy => {
    if (!isHealthy) {
      setError('Cannot connect to server. Please try again later.');
    }
  });
}, []);
```

### Request Logging

```javascript
// src/api/client.js - Enhanced with logging
class ApiClient {
  async request(endpoint, options = {}) {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;

    console.group(`🌐 ${options.method || 'GET'} ${endpoint}`);
    console.log('URL:', url);
    console.log('Options:', options);

    try {
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      console.log(`✅ ${response.status} (${duration}ms)`);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response:', data);
      console.groupEnd();
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Error (${duration}ms):`, error);
      console.groupEnd();
      throw error;
    }
  }
}
```

### Browser DevTools Network Tab

Monitor requests in Chrome/Firefox DevTools:

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for:
   - Request headers (Authorization, Content-Type)
   - Response headers (RateLimit-*, Access-Control-*)
   - Status codes
   - Response times

### Testing with Postman

Create a Postman collection:

```json
{
  "info": {
    "name": "CSEDU Club API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:4000"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/auth/me",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    }
  ]
}
```

### Mock API for Development

```javascript
// src/api/mockClient.js
export const mockApiClient = {
  async get(endpoint) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    
    if (endpoint === '/api/auth/me') {
      return {
        userId: 'mock-user-1',
        email: 'mock@example.com',
        name: 'Mock User',
        role: 'student'
      };
    }
    
    if (endpoint === '/api/events') {
      return [
        { id: 'e-1', title: 'Mock Event 1', date: '2026-05-01' },
        { id: 'e-2', title: 'Mock Event 2', date: '2026-05-15' }
      ];
    }
    
    throw new Error('Mock endpoint not implemented');
  },
  
  async post(endpoint, data) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (endpoint === '/api/auth/login') {
      return { token: 'mock-jwt-token-12345' };
    }
    
    return { message: 'Success' };
  }
};

// Use in development
const apiClient = process.env.NODE_ENV === 'development' && process.env.USE_MOCK
  ? mockApiClient
  : realApiClient;
```

---

## Common Integration Patterns

### 1. Infinite Scroll / Load More

```javascript
// src/hooks/useInfiniteScroll.js
import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export function useInfiniteScroll(endpoint) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`${endpoint}?page=${page}&limit=10`);
      
      setItems(prev => [...prev, ...response.data]);
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMore();
  }, []);

  return { items, loading, hasMore, loadMore };
}

// Usage
function EventsList() {
  const { items, loading, hasMore, loadMore } = useInfiniteScroll('/api/events');

  return (
    <div>
      {items.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### 2. Real-time Updates (Polling)

```javascript
// src/hooks/usePolling.js
import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';

export function usePolling(endpoint, interval = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const result = await apiClient.get(endpoint);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    fetchData(); // Initial fetch
    
    intervalRef.current = setInterval(fetchData, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [endpoint, interval]);

  return { data, error, refresh: fetchData };
}

// Usage: Live election results
function ElectionResults({ electionId }) {
  const { data, error } = usePolling(`/api/elections/${electionId}/results`, 10000);

  if (error) return <div>Error loading results</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Live Results</h2>
      {data.candidates.map(candidate => (
        <div key={candidate.id}>
          {candidate.name}: {candidate.votes} votes
        </div>
      ))}
    </div>
  );
}
```

### 3. Optimistic Updates

```javascript
// src/hooks/useOptimisticUpdate.js
import { useState } from 'react';
import { apiClient } from '../api/client';

export function useOptimisticUpdate(initialData) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  const update = async (updateFn, apiCall) => {
    const previousData = data;
    
    // Optimistically update UI
    setData(updateFn(data));
    
    try {
      // Make API call
      const result = await apiCall();
      // Update with server response
      setData(result);
      setError(null);
    } catch (err) {
      // Rollback on error
      setData(previousData);
      setError(err);
    }
  };

  return { data, error, update };
}

// Usage: Event registration
function EventCard({ event }) {
  const { data, error, update } = useOptimisticUpdate(event);

  const handleRegister = () => {
    update(
      // Optimistic update
      (prev) => ({ ...prev, isRegistered: true, attendees: prev.attendees + 1 }),
      // API call
      () => apiClient.post(`/api/events/${event.id}/register`)
    );
  };

  return (
    <div>
      <h3>{data.title}</h3>
      <p>{data.attendees} attendees</p>
      <button onClick={handleRegister} disabled={data.isRegistered}>
        {data.isRegistered ? 'Registered' : 'Register'}
      </button>
      {error && <p className="error">Registration failed</p>}
    </div>
  );
}
```

### 4. File Upload

```javascript
// src/api/upload.js
export async function uploadFile(file, endpoint) {
  const formData = new FormData();
  formData.append('file', file);

  const token = localStorage.getItem('authToken');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

// Usage component
function EventImageUpload({ eventId }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    setPreview(URL.createObjectURL(file));

    // Upload
    setUploading(true);
    try {
      const result = await uploadFile(file, `/api/events/${eventId}/image`);
      console.log('Upload successful:', result);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {preview && <img src={preview} alt="Preview" style={{ maxWidth: 200 }} />}
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
```

### 5. Search with Debounce

```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage: Search events
function EventSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const data = await apiClient.get(`/api/events?search=${debouncedQuery}`);
        setResults(data);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events..."
      />
      {loading && <p>Searching...</p>}
      <ul>
        {results.map(event => (
          <li key={event.id}>{event.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Application                    │
│                   (React/Vue/Angular/etc.)                   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ API Client   │  │ Error Handler│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │ Authorization: Bearer <token>
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway :4000                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Helmet  │→ │   CORS   │→ │  Morgan  │→ │Rate Limit│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              JWT Verification (Protected Routes)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Proxy Router (Route Mapping)            │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬──────────────┬──────────────┬──────────────┬───────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│   MS1   │   │   MS2   │   │   MS3   │   │   MS4   │
│  :3001  │   │  :3002  │   │  :3003  │   │  :3004  │
│         │   │         │   │         │   │         │
│  Auth   │   │Elections│   │ Events  │   │ Finance │
│  Users  │   │ Voting  │   │ Notices │   │  Logs   │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### Request Flow

1. **Frontend** sends HTTP request with JWT token
2. **API Gateway** receives request
3. **Security middleware** (Helmet) adds security headers
4. **CORS middleware** validates origin
5. **Logging middleware** (Morgan) logs request
6. **Rate limiter** checks request count
7. **JWT verification** (if protected route) validates token
8. **Proxy** forwards request to appropriate microservice
9. **Microservice** processes request and returns response
10. **Gateway** forwards response back to frontend

### Microservice Responsibilities

| Service | Port | Responsibilities |
|---------|------|------------------|
| MS1 | 3001 | User authentication, registration, profile management, password reset |
| MS2 | 3002 | Election management, candidate registration, voting, results |
| MS3 | 3003 | Event creation, event registration, notices, media management |
| MS4 | 3004 | Financial transactions, budget tracking, notifications, audit logs |

---

## Quick Reference

### Environment Setup Checklist

- [ ] Node.js 18+ installed
- [ ] API Gateway running on port 4000
- [ ] `.env` file configured with correct values
- [ ] JWT_SECRET matches across all services
- [ ] FRONTEND_ORIGIN includes your development URL
- [ ] All microservices (MS1-MS4) running

### Common Commands

```bash
# Start API Gateway
cd api-gateway
npm install
npm start

# Check health
curl http://localhost:4000/health

# Test with token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:4000/api/auth/me
```

### Key URLs

| Environment | Gateway URL |
|-------------|-------------|
| Development | http://localhost:4000 |
| Staging | https://api-staging.yourdomain.com |
| Production | https://api.yourdomain.com |

### Support & Resources

- **Backend Team:** Contact for JWT_SECRET and microservice URLs
- **API Documentation:** This file + individual microservice READMEs
- **Issue Tracker:** [Your issue tracker URL]
- **Slack/Discord:** [Your team communication channel]

---

## Troubleshooting

### "CORS error" in browser console

**Cause:** Your frontend origin is not whitelisted

**Fix:** Add your origin to `FRONTEND_ORIGIN` in gateway's `.env`:
```env
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:3000
```

### "401 Unauthorized" on protected routes

**Causes:**
1. Token is missing or malformed
2. Token has expired
3. JWT_SECRET mismatch between gateway and auth service

**Fix:**
```javascript
// Check token exists
const token = localStorage.getItem('authToken');
console.log('Token:', token ? 'exists' : 'missing');

// Check token format
console.log('Starts with Bearer?', token?.startsWith('Bearer'));

// Check expiration
import { jwtDecode } from 'jwt-decode';
const decoded = jwtDecode(token);
console.log('Expires:', new Date(decoded.exp * 1000));
```

### "429 Too Many Requests"

**Cause:** Rate limit exceeded

**Fix:** Wait for the rate limit window to reset (check `Retry-After` header) or reduce request frequency

### "503 Service Unavailable"

**Cause:** Target microservice is down or unreachable

**Fix:** 
1. Check if microservice is running
2. Verify MS*_URL in gateway's `.env` is correct
3. Check microservice logs for errors

### Token not persisting across page refreshes

**Cause:** Token not stored in localStorage/sessionStorage

**Fix:**
```javascript
// After login
localStorage.setItem('authToken', token);

// On app load
const token = localStorage.getItem('authToken');
if (token) {
  // Verify token is still valid
  authService.getProfile().catch(() => {
    localStorage.removeItem('authToken');
  });
}
```

---

## Changelog

### Version 1.0.0 (April 2026)
- Initial API Gateway implementation
- JWT authentication
- Rate limiting (general, auth, vote)
- Proxy routing for 4 microservices
- CORS configuration
- Security headers (Helmet)
- Request logging (Morgan)

---

## License

[Your License Here]

---

**Last Updated:** April 16, 2026  
**Maintained By:** Backend Team  
**Questions?** Contact [your-email@example.com]
