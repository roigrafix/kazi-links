# Twilio & Wix Secrets API Integration Guide

## Overview

This document explains how to integrate Twilio credentials securely using the Wix Secrets API. The integration provides a production-ready solution for managing sensitive API credentials without exposing them in your codebase.

## What's Been Implemented

### 1. **SecretsService** (`/src/services/secretsService.ts`)
A client-side service that:
- Fetches credentials from Wix Secrets API
- Falls back to environment variables for local development
- Caches credentials (1-hour default expiry)
- Provides methods to check configuration status
- Supports credential refresh and updates

### 2. **Updated Services**
- **TwilioService** - Now uses `secretsService` for credentials
- **NotificationService** - Now uses `secretsService` for credentials

### 3. **Documentation**
- **WIX_SECRETS_API_SETUP.md** - Complete setup guide
- **TWILIO_WIX_SECRETS_INTEGRATION.md** - This file

## Quick Start

### Step 1: Create Backend Functions

Create `/backend/secrets/getSecrets.js`:

```javascript
import { getSecret } from 'wix-secrets-backend';

export async function get_secrets(request) {
  try {
    const twilioAccountSid = await getSecret('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = await getSecret('TWILIO_AUTH_TOKEN');
    const twilioServiceSid = await getSecret('TWILIO_SERVICE_SID');
    const twilioPhoneNumber = await getSecret('TWILIO_PHONE_NUMBER');
    const sendGridApiKey = await getSecret('SENDGRID_API_KEY');

    return {
      body: {
        success: true,
        credentials: {
          twilioAccountSid: twilioAccountSid || undefined,
          twilioAuthToken: twilioAuthToken || undefined,
          twilioServiceSid: twilioServiceSid || undefined,
          twilioPhoneNumber: twilioPhoneNumber || undefined,
          sendGridApiKey: sendGridApiKey || undefined,
        },
      },
    };
  } catch (error) {
    console.error('Error retrieving secrets:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'Failed to retrieve secrets',
        message: error.message,
      },
    };
  }
}
```

Create `/backend/secrets/setSecrets.js` (optional):

```javascript
import { setSecret } from 'wix-secrets-backend';

export async function post_secrets(request) {
  try {
    const { credentials } = JSON.parse(request.body);

    if (credentials.twilioAccountSid) {
      await setSecret('TWILIO_ACCOUNT_SID', credentials.twilioAccountSid);
    }
    if (credentials.twilioAuthToken) {
      await setSecret('TWILIO_AUTH_TOKEN', credentials.twilioAuthToken);
    }
    if (credentials.twilioPhoneNumber) {
      await setSecret('TWILIO_PHONE_NUMBER', credentials.twilioPhoneNumber);
    }
    if (credentials.sendGridApiKey) {
      await setSecret('SENDGRID_API_KEY', credentials.sendGridApiKey);
    }

    return {
      body: {
        success: true,
        message: 'Secrets updated successfully',
      },
    };
  } catch (error) {
    console.error('Error storing secrets:', error);
    return {
      status: 500,
      body: {
        success: false,
        error: 'Failed to store secrets',
        message: error.message,
      },
    };
  }
}
```

### Step 2: Create HTTP Endpoints

Create `/backend/http-functions/secrets.js`:

```javascript
import { get_secrets } from '../secrets/getSecrets.js';
import { post_secrets } from '../secrets/setSecrets.js';

export async function get_api_secrets(request) {
  return get_secrets(request);
}

export async function post_api_secrets(request) {
  return post_secrets(request);
}
```

### Step 3: Create Secrets in Wix Dashboard

1. Go to **Develop** → **Secrets** in your Wix Dashboard
2. Create these secrets:
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
   - `TWILIO_SERVICE_SID` - Your Twilio Verify Service SID
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (for SMS)
   - `SENDGRID_API_KEY` - Your SendGrid API key

### Step 4: Initialize in Your App

In your main app component or Router:

```typescript
import { useEffect } from 'react';
import { secretsService } from '@/services/secretsService';

function App() {
  useEffect(() => {
    const initializeSecrets = async () => {
      const success = await secretsService.initialize();
      if (success) {
        console.log('✅ Secrets initialized successfully');
      } else {
        console.warn('⚠️ Using environment variables as fallback');
      }
    };

    initializeSecrets();
  }, []);

  return (
    // Your app content
  );
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  TwilioService / NotificationService                │  │
│  │  - Uses secretsService for credentials              │  │
│  │  - Sends OTP, verifies codes                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  secretsService                                      │  │
│  │  - Fetches from Wix Secrets API                     │  │
│  │  - Caches credentials (1 hour)                      │  │
│  │  - Falls back to env vars                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Wix Backend (Node.js)                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HTTP Endpoint: /api/secrets/get                    │  │
│  │  - Calls getSecrets() function                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  getSecrets() / setSecrets()                        │  │
│  │  - Uses wix-secrets-backend API                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Wix Secrets API (Secure Storage)               │
│                                                             │
│  - TWILIO_ACCOUNT_SID                                      │
│  - TWILIO_AUTH_TOKEN                                       │
│  - TWILIO_SERVICE_SID                                      │
│  - TWILIO_PHONE_NUMBER                                     │
│  - SENDGRID_API_KEY                                        │
└─────────────────────────────────────────────────────────────┘
```

## Usage Examples

### Example 1: Check Twilio Configuration

```typescript
import { secretsService } from '@/services/secretsService';

function TwilioStatus() {
  const isConfigured = secretsService.isTwilioConfigured();
  
  return (
    <div>
      {isConfigured ? (
        <p>✅ Twilio is configured and ready</p>
      ) : (
        <p>❌ Twilio is not configured</p>
      )}
    </div>
  );
}
```

### Example 2: Get Specific Credential

```typescript
import { secretsService } from '@/services/secretsService';

function GetCredential() {
  const accountSid = secretsService.getCredential('twilioAccountSid');
  const authToken = secretsService.getCredential('twilioAuthToken');
  
  return (
    <div>
      <p>Account SID: {accountSid ? '✅ Set' : '❌ Not Set'}</p>
      <p>Auth Token: {authToken ? '✅ Set' : '❌ Not Set'}</p>
    </div>
  );
}
```

### Example 3: Refresh Credentials

```typescript
import { secretsService } from '@/services/secretsService';

async function refreshCredentials() {
  const success = await secretsService.refresh();
  if (success) {
    console.log('✅ Credentials refreshed');
  } else {
    console.error('❌ Failed to refresh credentials');
  }
}
```

### Example 4: Store New Credentials

```typescript
import { secretsService } from '@/services/secretsService';

async function updateCredentials() {
  const success = await secretsService.storeCredentials({
    twilioAccountSid: 'new_account_sid',
    twilioAuthToken: 'new_auth_token',
  });
  
  if (success) {
    console.log('✅ Credentials updated');
  } else {
    console.error('❌ Failed to update credentials');
  }
}
```

## Environment Variables (Development Fallback)

For local development, create `.env.local`:

```env
# Twilio Configuration
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_SERVICE_SID=your_service_sid
VITE_TWILIO_PHONE_NUMBER=your_phone_number

# SendGrid Configuration
VITE_SENDGRID_API_KEY=your_sendgrid_key
```

**Important:** Add `.env.local` to `.gitignore` to prevent committing secrets.

## Configuration Priority

The services use this priority order for loading credentials:

1. **Wix Secrets API** (production) - Most secure
2. **Environment Variables** (development) - Fallback
3. **Hardcoded defaults** (only for non-sensitive values like Service SID)

## Security Best Practices

### ✅ DO:
- Use Wix Secrets API for production
- Rotate credentials regularly
- Monitor secret access in Wix Dashboard
- Use environment variables only for local development
- Cache credentials with appropriate expiry
- Validate all inputs before using credentials

### ❌ DON'T:
- Commit `.env.local` to version control
- Hardcode API keys in code
- Log sensitive credentials
- Share credentials via email or chat
- Use the same credentials across environments
- Expose credentials in error messages

## Troubleshooting

### Issue: "Twilio credentials not configured"

**Solution:**
1. Check that backend functions are deployed
2. Verify secrets exist in Wix Dashboard
3. Check browser console for errors
4. Verify HTTP endpoint paths match

### Issue: Service falls back to environment variables

**Solution:**
1. Check that Wix Secrets API is accessible
2. Verify backend function is deployed
3. Check network tab in browser DevTools
4. Ensure secrets are created in Wix Dashboard

### Issue: Credentials not updating after refresh

**Solution:**
1. Check cache expiry setting (default 1 hour)
2. Call `secretsService.refresh()` to force refresh
3. Clear browser cache and reload
4. Check that `setSecrets` backend function is deployed

### Issue: "Failed to retrieve secrets" error

**Solution:**
1. Verify HTTP endpoint URL is correct
2. Check backend function permissions
3. Ensure `wix-secrets-backend` package is installed
4. Check Wix Dashboard for errors

## API Reference

### SecretsService Methods

#### `initialize(): Promise<boolean>`
Initializes secrets from Wix Secrets API or environment variables.

**Returns:** `Promise<boolean>` - True if successful

**Example:**
```typescript
const success = await secretsService.initialize();
```

#### `getCredential(key): string | undefined`
Gets a specific credential.

**Parameters:**
- `key: keyof SecretCredentials` - The credential key

**Returns:** `string | undefined` - The credential value

**Example:**
```typescript
const accountSid = secretsService.getCredential('twilioAccountSid');
```

#### `getAllCredentials(): SecretCredentials`
Gets all credentials.

**Returns:** `SecretCredentials` - All credentials

**Example:**
```typescript
const allCreds = secretsService.getAllCredentials();
```

#### `isTwilioConfigured(): boolean`
Checks if Twilio is configured.

**Returns:** `boolean`

**Example:**
```typescript
if (secretsService.isTwilioConfigured()) {
  // Use Twilio
}
```

#### `isSendGridConfigured(): boolean`
Checks if SendGrid is configured.

**Returns:** `boolean`

**Example:**
```typescript
if (secretsService.isSendGridConfigured()) {
  // Use SendGrid
}
```

#### `refresh(): Promise<boolean>`
Forces refresh of credentials from Wix Secrets API.

**Returns:** `Promise<boolean>` - True if successful

**Example:**
```typescript
await secretsService.refresh();
```

#### `storeCredentials(credentials): Promise<boolean>`
Stores credentials in Wix Secrets API.

**Parameters:**
- `credentials: Partial<SecretCredentials>` - Credentials to store

**Returns:** `Promise<boolean>` - True if successful

**Example:**
```typescript
await secretsService.storeCredentials({
  twilioAccountSid: 'new_sid',
  twilioAuthToken: 'new_token',
});
```

#### `clearCache(): void`
Clears cached credentials.

**Returns:** `void`

**Example:**
```typescript
secretsService.clearCache();
```

## File Structure

```
/src
├── services/
│   ├── secretsService.ts          ← New: Secrets management
│   ├── twilioService.ts           ← Updated: Uses secretsService
│   └── notificationService.ts     ← Updated: Uses secretsService
├── WIX_SECRETS_API_SETUP.md       ← Detailed setup guide
└── TWILIO_WIX_SECRETS_INTEGRATION.md ← This file

/backend
├── secrets/
│   ├── getSecrets.js              ← New: Retrieve secrets
│   └── setSecrets.js              ← New: Store secrets
└── http-functions/
    └── secrets.js                 ← New: HTTP endpoints
```

## Next Steps

1. ✅ Review the implementation in `/src/services/secretsService.ts`
2. ✅ Create backend functions in your Wix project
3. ✅ Create secrets in Wix Dashboard
4. ✅ Deploy backend functions
5. ✅ Initialize `secretsService` in your app
6. ✅ Test with your Twilio and SendGrid integrations
7. ✅ Monitor secret access in Wix Dashboard

## Support & Resources

- [Wix Secrets API Documentation](https://www.wix.com/velo/reference/wix-secrets-backend)
- [Wix Backend Functions Guide](https://www.wix.com/velo/reference/wix-web-module)
- [Twilio Documentation](https://www.twilio.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)

## Summary

The Wix Secrets API integration provides:

✅ **Security** - Credentials stored securely in Wix, not in code
✅ **Flexibility** - Easy credential rotation and updates
✅ **Reliability** - Automatic fallback to environment variables
✅ **Performance** - Credential caching with configurable expiry
✅ **Auditability** - Track secret access in Wix Dashboard
✅ **Scalability** - Works across development, staging, and production

Your Twilio and SendGrid integrations are now production-ready! 🚀
