# Firebase Configuration with Wix Secrets Manager

This guide explains how to fetch and use Firebase configuration details from the Wix Secrets Manager.

## Overview

The Firebase configuration has been integrated with the Wix Secrets Manager to securely store and retrieve sensitive credentials. The system automatically:

1. **Fetches Firebase configuration** from Wix Secrets Manager on app startup
2. **Validates configuration** to ensure all required fields are present
3. **Falls back to environment variables** for local development
4. **Initializes Firebase** with the retrieved configuration

## Configuration Fields

The following Firebase configuration fields are now managed through Wix Secrets Manager:

```typescript
{
  firebaseApiKey: string;           // API Key
  firebaseAuthDomain: string;       // Auth Domain
  firebaseProjectId: string;        // Project ID
  firebaseStorageBucket: string;    // Storage Bucket
  firebaseMessagingSenderId: string; // Messaging Sender ID
  firebaseAppId: string;            // App ID
  firebaseMeasurementId: string;    // Measurement ID (optional)
}
```

## How to Save Firebase Configuration to Wix Secrets Manager

### Step 1: Access Wix Secrets Manager

1. Go to your Wix project dashboard
2. Navigate to **Settings** → **Secrets Manager**
3. Click **Add Secret**

### Step 2: Add Each Firebase Configuration Field

Create the following secrets with your Firebase project details:

| Secret Name | Value | Source |
|---|---|---|
| `firebaseApiKey` | Your Firebase API Key | Firebase Console → Project Settings |
| `firebaseAuthDomain` | Your Auth Domain | Firebase Console → Project Settings |
| `firebaseProjectId` | Your Project ID | Firebase Console → Project Settings |
| `firebaseStorageBucket` | Your Storage Bucket | Firebase Console → Project Settings |
| `firebaseMessagingSenderId` | Your Messaging Sender ID | Firebase Console → Project Settings |
| `firebaseAppId` | Your App ID | Firebase Console → Project Settings |
| `firebaseMeasurementId` | Your Measurement ID (optional) | Firebase Console → Project Settings |

### Step 3: Example Firebase Configuration

Your Firebase configuration should look like this:

```
firebaseApiKey: AIzaSyB79Ulw8ssi5I8nzpcueoX3poDOex2OtaY
firebaseAuthDomain: kazilinks-95d1d.firebaseapp.com
firebaseProjectId: kazilinks-95d1d
firebaseStorageBucket: kazilinks-95d1d.firebasestorage.app
firebaseMessagingSenderId: 448542748498
firebaseAppId: 1:448542748498:web:bbaa6b46c32a86ad37d48b
firebaseMeasurementId: G-50650X2SB9
```

## How It Works

### 1. Automatic Initialization

When your app starts, the `secretsService` automatically:

```typescript
// In Layout.tsx or your app initialization
useEffect(() => {
  const initializeSecrets = async () => {
    const success = await secretsService.initialize();
    if (success) {
      console.log('✅ Secrets initialized successfully');
    }
  };
  initializeSecrets();
}, []);
```

### 2. Firebase Configuration Loading

The `firebaseConfig.ts` module automatically loads Firebase configuration:

```typescript
// Automatically called when Firebase is needed
const config = await getFirebaseConfigFromSecrets();

// Or during Firebase initialization
const app = await initializeFirebaseApp();
```

### 3. Configuration Validation

The system validates that all required fields are present:

```typescript
// Required fields
- apiKey ✓
- authDomain ✓
- projectId ✓

// Optional fields
- storageBucket
- messagingSenderId
- appId
- measurementId
```

## Usage in Your Code

### Getting Firebase Configuration

```typescript
import { getFirebaseConfigFromSecrets } from '@/services/firebaseConfig';

// Get the full Firebase configuration
const config = await getFirebaseConfigFromSecrets();
console.log(config);
// Output:
// {
//   apiKey: "...",
//   authDomain: "...",
//   projectId: "...",
//   ...
// }
```

### Checking if Firebase is Configured

```typescript
import { secretsService } from '@/services/secretsService';

// Check if Firebase is properly configured
const isConfigured = secretsService.isFirebaseConfigured();
if (isConfigured) {
  console.log('Firebase is ready to use');
}
```

### Getting Individual Firebase Credentials

```typescript
import { secretsService } from '@/services/secretsService';

// Get a specific Firebase credential
const apiKey = secretsService.getCredential('firebaseApiKey');
const projectId = secretsService.getCredential('firebaseProjectId');
```

### Initializing Firebase

```typescript
import { initializeFirebaseApp } from '@/services/firebaseConfig';

// Initialize Firebase with configuration from Wix Secrets
const app = await initializeFirebaseApp();
if (app) {
  console.log('Firebase initialized successfully');
}
```

## Local Development Setup

For local development, you can use environment variables as a fallback:

### Create `.env.local` file

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

The system will automatically use these environment variables if Wix Secrets Manager is not available.

## Error Handling

The system provides helpful error messages:

### Missing Configuration

```
⚠️ Firebase configuration is incomplete in Wix Secrets Manager.
Required fields: apiKey, authDomain, projectId
Please ensure all Firebase configuration details are saved in Wix Secrets Manager.
```

### Firebase SDK Not Installed

```
⚠️ Firebase SDK is not installed. Phone authentication will be disabled.
To enable Firebase, run: npm install firebase
```

## Troubleshooting

### Issue: Firebase configuration not loading

**Solution:**
1. Verify all Firebase secrets are saved in Wix Secrets Manager
2. Check that the secret names match exactly (case-sensitive)
3. Ensure the `secretsService.initialize()` is called on app startup
4. Check browser console for error messages

### Issue: "Firebase SDK is not installed"

**Solution:**
```bash
npm install firebase
```

### Issue: Incomplete configuration warning

**Solution:**
1. Go to Wix Secrets Manager
2. Verify that `firebaseApiKey`, `firebaseAuthDomain`, and `firebaseProjectId` are all set
3. These three fields are required; others are optional

## Backend Integration

The Wix Secrets Manager integration uses backend functions to securely retrieve secrets:

### Backend Function: `/backend/secrets/getSecrets.js`

This function retrieves secrets from Wix Secrets Manager:

```javascript
import { getSecrets } from 'wix-secrets-backend';

export async function getSecrets() {
  try {
    const secrets = await getSecrets([
      'firebaseApiKey',
      'firebaseAuthDomain',
      'firebaseProjectId',
      'firebaseStorageBucket',
      'firebaseMessagingSenderId',
      'firebaseAppId',
      'firebaseMeasurementId',
      'twilioAccountSid',
      'twilioAuthToken',
      'twilioServiceSid',
      'sendGridApiKey'
    ]);
    
    return {
      credentials: secrets
    };
  } catch (error) {
    console.error('Error retrieving secrets:', error);
    throw error;
  }
}
```

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use Wix Secrets Manager** for production deployments
3. **Use environment variables** only for local development
4. **Rotate credentials regularly** in Wix Secrets Manager
5. **Limit access** to Wix Secrets Manager to authorized team members

## Summary

The Firebase configuration is now securely managed through Wix Secrets Manager. The system:

✅ Automatically fetches Firebase configuration on app startup
✅ Validates configuration completeness
✅ Falls back to environment variables for local development
✅ Provides helpful error messages for troubleshooting
✅ Supports all Firebase configuration fields
✅ Integrates seamlessly with existing services

Your Firebase configuration is now secure and production-ready!
