# Google OAuth Backend Integration Guide - KaziLinks

This guide provides complete backend integration for Google OAuth with secure token validation and production-ready session management.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend Setup](#backend-setup)
4. [Token Validation](#token-validation)
5. [Session Management](#session-management)
6. [Security Best Practices](#security-best-practices)
7. [Implementation Examples](#implementation-examples)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Backend Validation?

While the frontend can decode JWT tokens, **production applications must validate tokens on the backend** because:

- ✅ Prevents token tampering
- ✅ Verifies token signature with Google's public keys
- ✅ Checks token expiration
- ✅ Validates token audience and issuer
- ✅ Enables secure session management
- ✅ Protects against replay attacks

### Current Flow (Frontend Only)

```
User → Google Sign-In → Frontend Decodes Token → localStorage
```

### Recommended Flow (With Backend)

```
User → Google Sign-In → Frontend Sends Token → Backend Validates → Session Created → Secure Cookie
```

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. User clicks "Sign in with Google"                │   │
│  │ 2. Google SDK returns ID token                       │   │
│  │ 3. Send token to backend: POST /api/auth/google      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Receive ID token                                 │   │
│  │ 2. Verify token signature with Google's public keys │   │
│  │ 3. Validate token claims (exp, aud, iss)           │   │
│  │ 4. Check/create user in database                    │   │
│  │ 5. Create session/JWT                               │   │
│  │ 6. Set secure HTTP-only cookie                      │   │
│  │ 7. Return user data                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Receive user data                                │   │
│  │ 2. Update app state                                 │   │
│  │ 3. Redirect to dashboard                            │   │
│  │ 4. Subsequent requests include secure cookie        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Token Validation Process

```
ID Token (from Google)
    ↓
[1] Decode Header & Payload
    ↓
[2] Verify Signature (using Google's public keys)
    ↓
[3] Validate Claims:
    - exp (expiration) - must be in future
    - aud (audience) - must match CLIENT_ID
    - iss (issuer) - must be accounts.google.com
    - iat (issued at) - must be recent
    ↓
[4] Check User in Database
    ↓
[5] Create Session/JWT
    ↓
[6] Set Secure Cookie
```

---

## Backend Setup

### Prerequisites

```bash
# Node.js packages needed
npm install google-auth-library express cors dotenv
npm install --save-dev @types/express @types/node
```

### Environment Variables

Create `.env` in your backend root:

```env
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# Session/JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-super-secret-session-key

# Database (if using)
DATABASE_URL=your-database-url

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

### Basic Express Setup

```typescript
// server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Allow cookies
}));

// Routes
app.post('/api/auth/google', async (req, res) => {
  // Implementation below
});

app.post('/api/auth/logout', (req, res) => {
  // Implementation below
});

app.get('/api/auth/me', (req, res) => {
  // Implementation below
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Token Validation

### Method 1: Using Google Auth Library (Recommended)

```typescript
// services/googleAuthService.ts
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid token payload');
    }

    // Validate required claims
    if (!payload.email || !payload.email_verified) {
      throw new Error('Email not verified');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}
```

### Method 2: Manual Verification (Advanced)

```typescript
// services/manualTokenVerification.ts
import jwt from 'jsonwebtoken';
import axios from 'axios';

interface GooglePublicKeys {
  [key: string]: string;
}

let cachedPublicKeys: GooglePublicKeys | null = null;
let keysCacheTime = 0;

async function getGooglePublicKeys(): Promise<GooglePublicKeys> {
  // Cache keys for 1 hour
  if (cachedPublicKeys && Date.now() - keysCacheTime < 3600000) {
    return cachedPublicKeys;
  }

  try {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v1/certs'
    );
    cachedPublicKeys = response.data;
    keysCacheTime = Date.now();
    return cachedPublicKeys;
  } catch (error) {
    throw new Error('Failed to fetch Google public keys');
  }
}

export async function verifyGoogleTokenManually(token: string) {
  try {
    // Decode without verification first to get the kid
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded || !decoded.header.kid) {
      throw new Error('Invalid token format');
    }

    // Get Google's public keys
    const publicKeys = await getGooglePublicKeys();
    const publicKey = publicKeys[decoded.header.kid];

    if (!publicKey) {
      throw new Error('Public key not found');
    }

    // Verify signature and claims
    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      audience: process.env.GOOGLE_CLIENT_ID,
      issuer: 'https://accounts.google.com',
    }) as any;

    return {
      id: verified.sub,
      email: verified.email,
      name: verified.name,
      picture: verified.picture,
      emailVerified: verified.email_verified,
    };
  } catch (error) {
    console.error('Manual token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}
```

---

## Session Management

### Method 1: HTTP-Only Cookies (Recommended)

```typescript
// middleware/sessionMiddleware.ts
import jwt from 'jsonwebtoken';

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  picture: string;
}

export function createSession(payload: SessionPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d', // Session expires in 7 days
    algorithm: 'HS256',
  });
}

export function setSessionCookie(res: any, sessionToken: string) {
  res.cookie('session', sessionToken, {
    httpOnly: true,        // Not accessible from JavaScript
    secure: true,          // Only sent over HTTPS
    sameSite: 'strict',    // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: process.env.COOKIE_DOMAIN, // Your domain
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as SessionPayload;
  } catch (error) {
    return null;
  }
}

export function clearSessionCookie(res: any) {
  res.clearCookie('session', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    domain: process.env.COOKIE_DOMAIN,
  });
}
```

### Method 2: Refresh Token Pattern

```typescript
// services/refreshTokenService.ts
import jwt from 'jsonwebtoken';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function createTokenPair(userId: string, email: string): TokenPair {
  const accessToken = jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
}

export function refreshAccessToken(refreshToken: string): string | null {
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any;
    
    if (payload.type !== 'refresh') {
      return null;
    }

    return jwt.sign(
      { userId: payload.userId, email: payload.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  } catch (error) {
    return null;
  }
}
```

---

## Security Best Practices

### 1. Token Validation Checklist

```typescript
export async function validateGoogleToken(token: string) {
  // ✅ Check 1: Token format
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token format');
  }

  // ✅ Check 2: Token length (JWT tokens are typically 800-2000 chars)
  if (token.length < 100 || token.length > 5000) {
    throw new Error('Token length invalid');
  }

  // ✅ Check 3: Token structure (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  // ✅ Check 4: Verify with Google
  const payload = await verifyGoogleToken(token);

  // ✅ Check 5: Validate claims
  if (!payload.email || !payload.emailVerified) {
    throw new Error('Email not verified');
  }

  // ✅ Check 6: Check expiration
  if (new Date() > payload.expiresAt) {
    throw new Error('Token expired');
  }

  // ✅ Check 7: Validate email domain (optional)
  const allowedDomains = ['gmail.com', 'company.com'];
  const emailDomain = payload.email.split('@')[1];
  if (!allowedDomains.includes(emailDomain)) {
    throw new Error('Email domain not allowed');
  }

  return payload;
}
```

### 2. Rate Limiting

```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  skip: (req) => {
    // Skip rate limiting for authenticated requests
    return !!req.user;
  },
});
```

### 3. CSRF Protection

```typescript
// middleware/csrfProtection.ts
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

export const csrfProtection = csrf({ cookie: true });

// Middleware setup
app.use(cookieParser());
app.use(csrfProtection);

// Endpoint to get CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 4. Input Validation

```typescript
// middleware/validation.ts
import { body, validationResult } from 'express-validator';

export const validateGoogleAuth = [
  body('token')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Token is required')
    .isLength({ min: 100, max: 5000 })
    .withMessage('Token length invalid'),
];

export const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
```

### 5. Logging and Monitoring

```typescript
// middleware/logging.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log authentication events
export function logAuthEvent(
  event: string,
  userId: string,
  email: string,
  success: boolean,
  details?: any
) {
  logger.info({
    event,
    userId,
    email,
    success,
    timestamp: new Date(),
    ...details,
  });
}
```

---

## Implementation Examples

### Complete Authentication Endpoint

```typescript
// routes/auth.ts
import express from 'express';
import { verifyGoogleToken } from '../services/googleAuthService';
import { createSession, setSessionCookie } from '../middleware/sessionMiddleware';
import { validateGoogleAuth, handleValidationErrors } from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';
import { logAuthEvent } from '../middleware/logging';

const router = express.Router();

// User model (example with MongoDB)
interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  picture: string;
  createdAt: Date;
  lastLoginAt: Date;
}

// POST /api/auth/google
router.post(
  '/google',
  authLimiter,
  validateGoogleAuth,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token } = req.body;

      // Step 1: Verify token with Google
      const googlePayload = await verifyGoogleToken(token);

      // Step 2: Find or create user in database
      let user = await User.findOne({ googleId: googlePayload.id });

      if (!user) {
        // Create new user
        user = await User.create({
          googleId: googlePayload.id,
          email: googlePayload.email,
          name: googlePayload.name,
          picture: googlePayload.picture,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        logAuthEvent('user_created', user._id, user.email, true, {
          source: 'google_oauth',
        });
      } else {
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        logAuthEvent('user_login', user._id, user.email, true, {
          source: 'google_oauth',
        });
      }

      // Step 3: Create session
      const sessionToken = createSession({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      });

      // Step 4: Set secure cookie
      setSessionCookie(res, sessionToken);

      // Step 5: Return user data
      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      });
    } catch (error) {
      logAuthEvent('auth_failed', 'unknown', 'unknown', false, {
        error: error.message,
      });

      res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me (Protected route)
router.get('/me', authenticateSession, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
```

### Middleware for Protected Routes

```typescript
// middleware/auth.ts
import { verifySession } from './sessionMiddleware';

export function authenticateSession(req: any, res: any, next: any) {
  const sessionToken = req.cookies.session;

  if (!sessionToken) {
    return res.status(401).json({
      success: false,
      error: 'Not authenticated',
    });
  }

  const session = verifySession(sessionToken);

  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Invalid session',
    });
  }

  req.user = session;
  next();
}

// Usage in routes
app.get('/api/protected', authenticateSession, (req, res) => {
  res.json({
    message: `Hello ${req.user.name}`,
    user: req.user,
  });
});
```

### Frontend Integration

```typescript
// src/services/authService.ts
export async function loginWithGoogle(googleToken: string) {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ token: googleToken }),
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

export async function getCurrentUser() {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}
```

### Updated LoginPage Component

```typescript
// src/components/pages/LoginPage.tsx
import { handleGoogleSignInResponse } from '@/services/googleOAuthService';
import { loginWithGoogle } from '@/services/authService';

const handleGoogleResponse = async (response: any) => {
  try {
    const userData = handleGoogleSignInResponse(response);
    
    // Send token to backend
    const user = await loginWithGoogle(userData.token);
    
    console.log('Login successful:', user);
    navigate('/');
  } catch (err) {
    setError('Login failed. Please try again.');
    console.error('Login error:', err);
  }
};
```

---

## Testing

### Unit Tests

```typescript
// tests/googleAuthService.test.ts
import { verifyGoogleToken } from '../services/googleAuthService';

describe('Google Auth Service', () => {
  it('should verify valid token', async () => {
    const validToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ...';
    const payload = await verifyGoogleToken(validToken);
    
    expect(payload.email).toBeDefined();
    expect(payload.emailVerified).toBe(true);
  });

  it('should reject invalid token', async () => {
    const invalidToken = 'invalid.token.here';
    
    expect(() => verifyGoogleToken(invalidToken)).rejects.toThrow();
  });

  it('should reject expired token', async () => {
    const expiredToken = 'eyJhbGciOiJSUzI1NiJ9...'; // Expired
    
    expect(() => verifyGoogleToken(expiredToken)).rejects.toThrow();
  });
});
```

### Integration Tests

```typescript
// tests/auth.integration.test.ts
import request from 'supertest';
import app from '../app';

describe('Authentication Endpoints', () => {
  it('POST /api/auth/google should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/google')
      .send({ token: validGoogleToken });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBeDefined();
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('GET /api/auth/me should return current user', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBeDefined();
  });

  it('POST /api/auth/logout should clear session', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid Client ID"

**Cause**: Client ID doesn't match between frontend and backend

**Solution**:
```bash
# Verify in backend .env
echo $GOOGLE_CLIENT_ID

# Should match frontend VITE_GOOGLE_CLIENT_ID
```

#### 2. "Token Verification Failed"

**Cause**: Token is expired or signature is invalid

**Solution**:
```typescript
// Check token expiration
const decoded = jwt.decode(token, { complete: true });
console.log('Expires at:', new Date(decoded.payload.exp * 1000));

// Verify token is fresh (less than 1 hour old)
const issuedAt = decoded.payload.iat;
const now = Math.floor(Date.now() / 1000);
if (now - issuedAt > 3600) {
  throw new Error('Token too old');
}
```

#### 3. "CORS Error"

**Cause**: Frontend domain not in CORS whitelist

**Solution**:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://yourdomain.com',
  ],
  credentials: true,
}));
```

#### 4. "Cookie Not Set"

**Cause**: Secure flag requires HTTPS

**Solution**:
```typescript
// Development (HTTP)
setSessionCookie(res, token, {
  secure: process.env.NODE_ENV === 'production',
});

// Or use environment variable
const isSecure = process.env.NODE_ENV === 'production';
res.cookie('session', token, {
  httpOnly: true,
  secure: isSecure,
  sameSite: 'strict',
});
```

#### 5. "User Not Found After Login"

**Cause**: Database connection issue or user creation failed

**Solution**:
```typescript
// Add detailed logging
try {
  const user = await User.create({...});
  logger.info('User created:', user._id);
} catch (error) {
  logger.error('User creation failed:', error);
  throw error;
}
```

---

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Enable HTTPS (secure cookies require HTTPS)
- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure database connection
- [ ] Set up logging and monitoring
- [ ] Enable rate limiting
- [ ] Enable CSRF protection
- [ ] Test token validation with Google
- [ ] Test session creation and verification
- [ ] Test logout functionality
- [ ] Monitor authentication logs
- [ ] Set up alerts for failed authentications

---

## Next Steps

1. **Implement backend endpoints** using the examples above
2. **Set up database** to store users
3. **Configure environment variables**
4. **Test token validation** with real Google tokens
5. **Implement session management** (cookies or JWT)
6. **Add security middleware** (rate limiting, CSRF, etc.)
7. **Set up logging and monitoring**
8. **Deploy to production**
9. **Monitor authentication events**
10. **Implement refresh token rotation** (optional)

---

## References

- [Google Auth Library for Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [HTTP-Only Cookies](https://owasp.org/www-community/attacks/csrf)
