/**
 * Backend Google OAuth Service
 * This file contains examples and utilities for backend token validation
 * 
 * NOTE: This is a reference implementation. Your actual backend should be
 * in a separate Node.js/Express server, not in the frontend code.
 */

/**
 * Example: How to validate Google tokens on your backend
 * 
 * This demonstrates the validation process that should happen on your backend server.
 */

// ============================================================================
// EXAMPLE 1: Using Google Auth Library (Recommended)
// ============================================================================

/**
 * Backend implementation using google-auth-library
 * 
 * Install: npm install google-auth-library
 * 
 * Usage:
 * ```typescript
 * import { OAuth2Client } from 'google-auth-library';
 * 
 * const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
 * const payload = await verifyGoogleToken(token);
 * ```
 */
export const EXAMPLE_BACKEND_GOOGLE_AUTH = `
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
`;

// ============================================================================
// EXAMPLE 2: Complete Authentication Endpoint
// ============================================================================

export const EXAMPLE_AUTH_ENDPOINT = `
import express from 'express';
import { verifyGoogleToken } from '../services/googleAuthService';
import { createSession, setSessionCookie } from '../middleware/sessionMiddleware';

const router = express.Router();

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    // Step 1: Validate input
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    // Step 2: Verify token with Google
    const googlePayload = await verifyGoogleToken(token);

    // Step 3: Find or create user in database
    let user = await User.findOne({ googleId: googlePayload.id });

    if (!user) {
      user = await User.create({
        googleId: googlePayload.id,
        email: googlePayload.email,
        name: googlePayload.name,
        picture: googlePayload.picture,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    } else {
      user.lastLoginAt = new Date();
      await user.save();
    }

    // Step 4: Create session
    const sessionToken = createSession({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
    });

    // Step 5: Set secure HTTP-only cookie
    setSessionCookie(res, sessionToken);

    // Step 6: Return user data
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
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    });
  }
});

export default router;
`;

// ============================================================================
// EXAMPLE 3: Session Management with HTTP-Only Cookies
// ============================================================================

export const EXAMPLE_SESSION_MIDDLEWARE = `
import jwt from 'jsonwebtoken';

interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  picture: string;
}

export function createSession(payload: SessionPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
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
    domain: process.env.COOKIE_DOMAIN,
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
`;

// ============================================================================
// EXAMPLE 4: Protected Route Middleware
// ============================================================================

export const EXAMPLE_AUTH_MIDDLEWARE = `
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

// Usage in routes:
app.get('/api/protected', authenticateSession, (req, res) => {
  res.json({
    message: \`Hello \${req.user.name}\`,
    user: req.user,
  });
});
`;

// ============================================================================
// EXAMPLE 5: Frontend Integration with Backend
// ============================================================================

export const EXAMPLE_FRONTEND_AUTH_SERVICE = `
// src/services/authService.ts

export async function loginWithGoogle(googleToken: string) {
  try {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies in request
      body: JSON.stringify({ token: googleToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
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
`;

// ============================================================================
// EXAMPLE 6: Environment Variables (.env)
// ============================================================================

export const EXAMPLE_ENV_FILE = `
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# Session/JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
SESSION_SECRET=your-super-secret-session-key

# Database
DATABASE_URL=mongodb://localhost:27017/kazilinks

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
COOKIE_DOMAIN=yourdomain.com

# Logging
LOG_LEVEL=info
`;

// ============================================================================
// EXAMPLE 7: Token Validation Checklist
// ============================================================================

export const TOKEN_VALIDATION_CHECKLIST = {
  checks: [
    {
      name: 'Token Format',
      description: 'Verify token is a string with 3 parts separated by dots',
      code: 'const parts = token.split("."); if (parts.length !== 3) throw new Error("Invalid format");',
    },
    {
      name: 'Token Length',
      description: 'Verify token length is reasonable (800-2000 chars)',
      code: 'if (token.length < 100 || token.length > 5000) throw new Error("Invalid length");',
    },
    {
      name: 'Signature Verification',
      description: 'Verify token signature with Google\'s public keys',
      code: 'const ticket = await client.verifyIdToken({ idToken: token, audience: CLIENT_ID });',
    },
    {
      name: 'Expiration Check',
      description: 'Verify token has not expired',
      code: 'if (new Date() > new Date(payload.exp * 1000)) throw new Error("Token expired");',
    },
    {
      name: 'Audience Validation',
      description: 'Verify token audience matches your Client ID',
      code: 'if (payload.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("Invalid audience");',
    },
    {
      name: 'Issuer Validation',
      description: 'Verify token issuer is Google',
      code: 'if (payload.iss !== "https://accounts.google.com") throw new Error("Invalid issuer");',
    },
    {
      name: 'Email Verification',
      description: 'Verify email is verified by Google',
      code: 'if (!payload.email_verified) throw new Error("Email not verified");',
    },
    {
      name: 'Issued At Check',
      description: 'Verify token was issued recently (not too old)',
      code: 'const issuedAt = payload.iat; const now = Math.floor(Date.now() / 1000); if (now - issuedAt > 3600) throw new Error("Token too old");',
    },
  ],
};

// ============================================================================
// EXAMPLE 8: Security Headers
// ============================================================================

export const EXAMPLE_SECURITY_HEADERS = `
import helmet from 'helmet';

app.use(helmet());

app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://accounts.google.com; frame-src https://accounts.google.com"
  );
  
  next();
});
`;

// ============================================================================
// EXAMPLE 9: Rate Limiting
// ============================================================================

export const EXAMPLE_RATE_LIMITING = `
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to auth endpoints
app.post('/api/auth/google', authLimiter, async (req, res) => {
  // ... authentication logic
});
`;

// ============================================================================
// EXAMPLE 10: Logging and Monitoring
// ============================================================================

export const EXAMPLE_LOGGING = `
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

function logAuthEvent(
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

// Usage
logAuthEvent('user_login', user._id, user.email, true, {
  source: 'google_oauth',
  ipAddress: req.ip,
});
`;

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

export const DEPLOYMENT_CHECKLIST = [
  '[ ] Set NODE_ENV=production',
  '[ ] Set FRONTEND_URL to production domain',
  '[ ] Enable HTTPS (required for secure cookies)',
  '[ ] Set strong JWT_SECRET (min 32 characters)',
  '[ ] Configure database connection',
  '[ ] Set up logging and monitoring',
  '[ ] Enable rate limiting on auth endpoints',
  '[ ] Enable CSRF protection',
  '[ ] Test token validation with real Google tokens',
  '[ ] Test session creation and verification',
  '[ ] Test logout functionality',
  '[ ] Monitor authentication logs',
  '[ ] Set up alerts for failed authentications',
  '[ ] Configure CORS for production domain',
  '[ ] Test with production Google Client ID',
  '[ ] Verify secure cookie settings',
  '[ ] Test token refresh mechanism',
  '[ ] Verify error messages don\'t leak sensitive info',
];

// ============================================================================
// QUICK START GUIDE
// ============================================================================

export const QUICK_START_GUIDE = `
# Backend Google OAuth Integration - Quick Start

## 1. Install Dependencies
npm install google-auth-library express cors dotenv jsonwebtoken

## 2. Create .env file
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
JWT_SECRET=your-super-secret-key-min-32-chars
FRONTEND_URL=http://localhost:5173

## 3. Create auth service (services/googleAuthService.ts)
- Use EXAMPLE_BACKEND_GOOGLE_AUTH above

## 4. Create session middleware (middleware/sessionMiddleware.ts)
- Use EXAMPLE_SESSION_MIDDLEWARE above

## 5. Create auth routes (routes/auth.ts)
- Use EXAMPLE_AUTH_ENDPOINT above

## 6. Create auth middleware (middleware/auth.ts)
- Use EXAMPLE_AUTH_MIDDLEWARE above

## 7. Update frontend (src/services/authService.ts)
- Use EXAMPLE_FRONTEND_AUTH_SERVICE above

## 8. Update LoginPage component
- Import loginWithGoogle from authService
- Call it after getting Google token

## 9. Test
npm run dev

## 10. Deploy
- Update FRONTEND_URL to production domain
- Enable HTTPS
- Set strong JWT_SECRET
- Configure database
`;

export default {
  EXAMPLE_BACKEND_GOOGLE_AUTH,
  EXAMPLE_AUTH_ENDPOINT,
  EXAMPLE_SESSION_MIDDLEWARE,
  EXAMPLE_AUTH_MIDDLEWARE,
  EXAMPLE_FRONTEND_AUTH_SERVICE,
  EXAMPLE_ENV_FILE,
  TOKEN_VALIDATION_CHECKLIST,
  EXAMPLE_SECURITY_HEADERS,
  EXAMPLE_RATE_LIMITING,
  EXAMPLE_LOGGING,
  DEPLOYMENT_CHECKLIST,
  QUICK_START_GUIDE,
};
