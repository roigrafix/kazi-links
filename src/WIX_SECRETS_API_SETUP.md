# Wix Secrets API Integration Guide

This guide explains how to securely manage Twilio and other third-party API credentials using the Wix Secrets API.

## Overview

The Wix Secrets API provides a secure way to store and retrieve sensitive credentials (API keys, tokens, etc.) without exposing them in your codebase or environment files.

### Key Benefits:
- ✅ Secure credential storage
- ✅ No hardcoded secrets in code
- ✅ Easy credential rotation
- ✅ Audit trail for access
- ✅ Production-ready security

## Architecture

```
Frontend (React)
    ↓
secretsService.ts (Client-side service)
    ↓
Backend HTTP Endpoint (/api/secrets/get)
    ↓
Wix Secrets API
    ↓
Wix Backend (getSecrets.js)
```

## Setup Instructions

### Step 1: Create Backend Functions

Create these files in your Wix backend directory (`/backend`):

#### `/backend/secrets/getSecrets.js`
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

#### `/backend/secrets/setSecrets.js` (Optional - for updating secrets)
```javascript
import { setSecret } from 'wix-secrets-backend';

export async function post_secrets(request) {
  try {
    const { credentials } = JSON.parse(request.body);

    // Store each credential
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

### Step 2: Create Secrets in Wix Dashboard

1. Go to **Develop** → **Secrets** in your Wix Dashboard
2. Create the following secrets:
   - `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
   - `TWILIO_SERVICE_SID` - Your Twilio Verify Service SID
   - `TWILIO_PHONE_NUMBER` - Your Twilio phone number (for SMS)
   - `SENDGRID_API_KEY` - Your SendGrid API key

### Step 3: Create HTTP Endpoints

Create HTTP endpoint files to expose your backend functions:

#### `/backend/http-functions/secrets.js`
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

### Step 4: Use in Frontend

The `secretsService` is already integrated and ready to use:

```typescript
import { secretsService } from '@/services/secretsService';

// Initialize at app startup
await secretsService.initialize();

// Get a specific credential
const accountSid = secretsService.getCredential('twilioAccountSid');

// Check if configured
if (secretsService.isTwilioConfigured()) {
  // Use Twilio
}

// Refresh credentials
await secretsService.refresh();
```

## Integration with Existing Services

### Twilio Service Integration

Update `/src/services/twilioService.ts`:

```typescript
import { secretsService } from './secretsService';

class TwilioService {
  private accountSid: string;
  private authToken: string;
  private serviceSid: string;

  constructor() {
    // Try to get from secrets first, fallback to env vars
    this.accountSid = secretsService.getCredential('twilioAccountSid') || 
                      import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    this.authToken = secretsService.getCredential('twilioAuthToken') || 
                     import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    this.serviceSid = secretsService.getCredential('twilioServiceSid') || 
                      import.meta.env.VITE_TWILIO_SERVICE_SID || '';
  }
  
  // ... rest of implementation
}
```

### Notification Service Integration

Update `/src/services/notificationService.ts`:

```typescript
import { secretsService } from './secretsService';

class NotificationService {
  private sendGridApiKey: string | null = null;
  private twilioAccountSid: string | null = null;
  private twilioAuthToken: string | null = null;
  private twilioPhoneNumber: string | null = null;

  constructor() {
    // Get from secrets first, fallback to env vars
    this.sendGridApiKey = secretsService.getCredential('sendGridApiKey') || 
                          import.meta.env.VITE_SENDGRID_API_KEY || null;
    this.twilioAccountSid = secretsService.getCredential('twilioAccountSid') || 
                            import.meta.env.VITE_TWILIO_ACCOUNT_SID || null;
    this.twilioAuthToken = secretsService.getCredential('twilioAuthToken') || 
                           import.meta.env.VITE_TWILIO_AUTH_TOKEN || null;
    this.twilioPhoneNumber = secretsService.getCredential('twilioPhoneNumber') || 
                             import.meta.env.VITE_TWILIO_PHONE_NUMBER || null;
  }
  
  // ... rest of implementation
}
```

## Usage Examples

### Example 1: Initialize Secrets on App Load

```typescript
// In your main App component or Router
import { useEffect } from 'react';
import { secretsService } from '@/services/secretsService';

function App() {
  useEffect(() => {
    const initializeSecrets = async () => {
      const success = await secretsService.initialize();
      if (success) {
        console.log('Secrets initialized successfully');
      } else {
        console.warn('Failed to initialize secrets, using environment variables');
      }
    };

    initializeSecrets();
  }, []);

  return (
    // Your app content
  );
}
```

### Example 2: Check Configuration Status

```typescript
import { secretsService } from '@/services/secretsService';

function ConfigStatus() {
  const twilioConfigured = secretsService.isTwilioConfigured();
  const sendGridConfigured = secretsService.isSendGridConfigured();

  return (
    <div>
      <p>Twilio: {twilioConfigured ? '✅ Configured' : '❌ Not Configured'}</p>
      <p>SendGrid: {sendGridConfigured ? '✅ Configured' : '❌ Not Configured'}</p>
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
    console.log('Credentials refreshed');
  } else {
    console.error('Failed to refresh credentials');
  }
}
```

## Environment Variables (Fallback)

For local development, you can still use environment variables as a fallback:

Create `.env.local` in your project root:

```env
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_SERVICE_SID=your_service_sid
VITE_TWILIO_PHONE_NUMBER=your_phone_number
VITE_SENDGRID_API_KEY=your_sendgrid_key
```

## Security Best Practices

1. **Never commit secrets** - Add `.env.local` to `.gitignore`
2. **Use Wix Secrets in production** - Environment variables are for development only
3. **Rotate credentials regularly** - Update secrets in Wix Dashboard periodically
4. **Limit access** - Only expose necessary credentials to frontend
5. **Audit logs** - Monitor secret access in Wix Dashboard
6. **Cache expiry** - Default cache is 1 hour, adjust as needed

## Troubleshooting

### Secrets not loading
- Check that backend functions are deployed
- Verify secrets exist in Wix Dashboard
- Check browser console for errors
- Verify HTTP endpoint paths match

### Fallback to environment variables
- If Wix Secrets API fails, the service automatically falls back to environment variables
- Check `.env.local` file exists and has correct values
- Restart development server after updating `.env.local`

### Cache issues
- Call `secretsService.refresh()` to force refresh
- Default cache expiry is 1 hour
- Adjust `cacheExpiry` in `SecretsServiceConfig` if needed

## API Reference

### `secretsService.initialize()`
Initializes secrets from Wix Secrets API or environment variables.

**Returns:** `Promise<boolean>` - True if successful

### `secretsService.getCredential(key)`
Gets a specific credential.

**Parameters:**
- `key: keyof SecretCredentials` - The credential key

**Returns:** `string | undefined` - The credential value

### `secretsService.getAllCredentials()`
Gets all credentials.

**Returns:** `SecretCredentials` - All credentials

### `secretsService.isTwilioConfigured()`
Checks if Twilio is configured.

**Returns:** `boolean`

### `secretsService.isSendGridConfigured()`
Checks if SendGrid is configured.

**Returns:** `boolean`

### `secretsService.refresh()`
Forces refresh of credentials from Wix Secrets API.

**Returns:** `Promise<boolean>` - True if successful

### `secretsService.storeCredentials(credentials)`
Stores credentials in Wix Secrets API.

**Parameters:**
- `credentials: Partial<SecretCredentials>` - Credentials to store

**Returns:** `Promise<boolean>` - True if successful

### `secretsService.clearCache()`
Clears cached credentials.

**Returns:** `void`

## Next Steps

1. Create backend functions in your Wix project
2. Create secrets in Wix Dashboard
3. Deploy backend functions
4. Initialize `secretsService` in your app
5. Update existing services to use `secretsService`
6. Test with your Twilio and SendGrid integrations

## Support

For more information:
- [Wix Secrets API Documentation](https://www.wix.com/velo/reference/wix-secrets-backend)
- [Twilio Documentation](https://www.twilio.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
