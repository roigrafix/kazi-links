# Backend Setup Guide for Google OAuth - KaziLinks

This guide walks you through setting up a production-ready backend server for Google OAuth authentication with secure token validation and session management.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Implementation](#implementation)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Project Structure

Create a separate backend project:

```
kazilinks-backend/
├── src/
│   ├── middleware/
│   │   ├── auth.ts              # Authentication middleware
│   │   ├── errorHandler.ts      # Error handling
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   ├── sessionMiddleware.ts # Session management
│   │   └── validation.ts        # Input validation
│   ├── routes/
│   │   ├── auth.ts              # Authentication routes
│   │   └── user.ts              # User routes
│   ├── services/
│   │   ├── googleAuthService.ts # Google token validation
│   │   ├── userService.ts       # User database operations
│   │   └── sessionService.ts    # Session management
│   ├── models/
│   │   └── User.ts              # User model
│   ├── config/
│   │   ├── database.ts          # Database configuration
│   │   └── env.ts               # Environment variables
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
├── tests/
│   ├── auth.test.ts
│   └── integration.test.ts
├── .env                         # Environment variables
├── .env.example                 # Example environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## Installation

### Step 1: Create Backend Project

```bash
# Create new directory
mkdir kazilinks-backend
cd kazilinks-backend

# Initialize Node.js project
npm init -y

# Install TypeScript
npm install -D typescript ts-node @types/node

# Initialize TypeScript
npx tsc --init
```

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install express cors dotenv

# Google OAuth
npm install google-auth-library

# Authentication & Security
npm install jsonwebtoken bcryptjs express-validator

# Rate limiting & CSRF
npm install express-rate-limit csurf cookie-parser

# Database (choose one)
npm install mongoose  # For MongoDB
# OR
npm install pg        # For PostgreSQL

# Logging
npm install winston

# Development dependencies
npm install -D nodemon @types/express @types/jsonwebtoken
```

### Step 3: Update package.json

```json
{
  "name": "kazilinks-backend",
  "version": "1.0.0",
  "description": "KaziLinks Backend API",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "google-auth-library": "^8.8.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "express-validator": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "csurf": "^1.11.0",
    "cookie-parser": "^1.4.6",
    "mongoose": "^7.0.0",
    "winston": "^3.8.2"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "@types/node": "^18.15.0",
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "nodemon": "^2.0.20"
  }
}
```

---

## Configuration

### Step 1: Create .env File

```bash
# Copy example
cp .env.example .env

# Edit with your values
nano .env
```

### Step 2: .env Content

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET

# JWT & Session
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
SESSION_SECRET=your-super-secret-session-key
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# Database
DATABASE_URL=mongodb://localhost:27017/kazilinks
# OR for PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost:5432/kazilinks

# Cookie Configuration
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false  # Set to true in production with HTTPS

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=5    # 5 requests per window
```

### Step 3: TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## Implementation

### Step 1: Environment Configuration

Create `src/config/env.ts`:

```typescript
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cookie: {
    domain: process.env.COOKIE_DOMAIN || 'localhost',
    secure: process.env.COOKIE_SECURE === 'true',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'JWT_SECRET',
  'DATABASE_URL',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

### Step 2: Google Auth Service

Create `src/services/googleAuthService.ts`:

```typescript
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env';

const client = new OAuth2Client(config.google.clientId);

export interface GooglePayload {
  id: string;
  email: string;
  name: string;
  picture: string;
  emailVerified: boolean;
  issuedAt: Date;
  expiresAt: Date;
}

export async function verifyGoogleToken(token: string): Promise<GooglePayload> {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    if (token.length < 100 || token.length > 5000) {
      throw new Error('Token length invalid');
    }

    // Verify with Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error('Invalid token payload');
    }

    // Validate required claims
    if (!payload.email || !payload.email_verified) {
      throw new Error('Email not verified');
    }

    // Check expiration
    const expiresAt = new Date(payload.exp * 1000);
    if (new Date() > expiresAt) {
      throw new Error('Token expired');
    }

    // Check issued at (token should be recent)
    const issuedAt = new Date(payload.iat * 1000);
    const now = new Date();
    const ageInSeconds = (now.getTime() - issuedAt.getTime()) / 1000;
    
    if (ageInSeconds > 3600) { // 1 hour
      throw new Error('Token too old');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name || '',
      picture: payload.picture || '',
      emailVerified: payload.email_verified,
      issuedAt,
      expiresAt,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}
```

### Step 3: Session Middleware

Create `src/middleware/sessionMiddleware.ts`:

```typescript
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  picture: string;
}

export function createSession(payload: SessionPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    algorithm: 'HS256',
  });
}

export function setSessionCookie(res: any, sessionToken: string): void {
  res.cookie('session', sessionToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    domain: config.cookie.domain,
  });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, config.jwt.secret) as SessionPayload;
  } catch (error) {
    return null;
  }
}

export function clearSessionCookie(res: any): void {
  res.clearCookie('session', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'strict',
    path: '/',
    domain: config.cookie.domain,
  });
}
```

### Step 4: Authentication Middleware

Create `src/middleware/auth.ts`:

```typescript
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
```

### Step 5: Auth Routes

Create `src/routes/auth.ts`:

```typescript
import express from 'express';
import { body, validationResult } from 'express-validator';
import { verifyGoogleToken } from '../services/googleAuthService';
import { createSession, setSessionCookie, clearSessionCookie } from '../middleware/sessionMiddleware';
import { authenticateSession } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// User model (example - adjust to your database)
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
  body('token').isString().trim().notEmpty(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token } = req.body;

      // Verify token with Google
      const googlePayload = await verifyGoogleToken(token);

      // Find or create user (example with MongoDB)
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

      // Create session
      const sessionToken = createSession({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
      });

      // Set secure cookie
      setSessionCookie(res, sessionToken);

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
  }
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateSession, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

export default router;
```

### Step 6: Express App Setup

Create `src/app.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import authRoutes from './routes/auth';

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

export default app;
```

### Step 7: Server Entry Point

Create `src/server.ts`:

```typescript
import app from './app';
import { config } from './config/env';

const PORT = config.server.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`Frontend URL: ${config.server.frontendUrl}`);
});
```

---

## Testing

### Step 1: Run Development Server

```bash
npm run dev
```

### Step 2: Test Authentication Endpoint

```bash
# Get a Google token from your frontend first, then:

curl -X POST http://localhost:3001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_GOOGLE_TOKEN_HERE"}'
```

### Step 3: Test Protected Route

```bash
# After getting session cookie:

curl http://localhost:3001/api/auth/me \
  -H "Cookie: session=YOUR_SESSION_COOKIE"
```

---

## Deployment

### Step 1: Build for Production

```bash
npm run build
```

### Step 2: Update Environment Variables

```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
COOKIE_SECURE=true
COOKIE_DOMAIN=yourdomain.com
```

### Step 3: Deploy to Hosting

Options:
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repo
- **DigitalOcean**: Deploy Node.js app
- **AWS**: Use Elastic Beanstalk or EC2
- **Google Cloud**: Use Cloud Run or App Engine

### Step 4: Verify Deployment

```bash
curl https://your-backend-domain.com/health
```

---

## Troubleshooting

### Issue: "GOOGLE_CLIENT_ID is not set"

**Solution**: Verify .env file exists and contains GOOGLE_CLIENT_ID

```bash
cat .env | grep GOOGLE_CLIENT_ID
```

### Issue: "Token verification failed"

**Solution**: Ensure token is fresh (less than 1 hour old) and Client ID matches

```bash
# Check token expiration
node -e "console.log(new Date(PAYLOAD.exp * 1000))"
```

### Issue: "CORS error"

**Solution**: Update FRONTEND_URL in .env

```env
FRONTEND_URL=http://localhost:5173  # Development
FRONTEND_URL=https://yourdomain.com # Production
```

### Issue: "Cookie not set"

**Solution**: Ensure HTTPS in production

```env
COOKIE_SECURE=false  # Development (HTTP)
COOKIE_SECURE=true   # Production (HTTPS)
```

---

## Next Steps

1. ✅ Set up backend project
2. ✅ Install dependencies
3. ✅ Configure environment variables
4. ✅ Implement authentication endpoints
5. ⏳ Set up database (MongoDB/PostgreSQL)
6. ⏳ Implement user model
7. ⏳ Add logging and monitoring
8. ⏳ Set up CI/CD pipeline
9. ⏳ Deploy to production
10. ⏳ Monitor authentication events

---

## References

- [Express.js Documentation](https://expressjs.com/)
- [Google Auth Library](https://github.com/googleapis/google-auth-library-nodejs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
