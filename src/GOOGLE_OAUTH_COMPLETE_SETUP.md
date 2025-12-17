# Google OAuth Complete Setup Guide

This guide provides step-by-step instructions to complete the Google OAuth login flow on your KaziLinks platform.

## Overview

The Google OAuth implementation is now fully integrated into:
- **HomePage.tsx** - "Sign In with Google" button in the hero section
- **LoginPage.tsx** - Google Sign-In with One Tap UI and button fallback
- **googleOAuthService.ts** - Complete OAuth service with proper initialization

## Prerequisites

1. **Google Cloud Project** - You need a Google Cloud Project with OAuth 2.0 credentials
2. **Client ID** - A valid Google OAuth 2.0 Client ID
3. **Environment Variables** - Proper configuration in `.env.local`

## Step 1: Create Google OAuth Credentials

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**

### 1.2 Create OAuth 2.0 Credentials
1. Go to **Credentials** in the left sidebar
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `http://localhost:3000` (if using different port)
   - `https://yourdomain.com` (for production)
5. Add authorized redirect URIs:
   - `http://localhost:5173/` (for development)
   - `https://yourdomain.com/` (for production)
6. Copy your **Client ID** (looks like: `xxx.apps.googleusercontent.com`)

## Step 2: Configure Environment Variables

### 2.1 Create `.env.local` file
In the root of your project, create or update `.env.local`:

```bash
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID from Step 1.

### 2.2 Verify the file
```bash
cat .env.local | grep VITE_GOOGLE_CLIENT_ID
```

You should see:
```
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## Step 3: Test the Implementation

### 3.1 Start the development server
```bash
npm run dev
```

### 3.2 Test on Home Page
1. Navigate to `http://localhost:5173/`
2. Look for the **"Sign In with Google"** button in the hero section
3. Click it and verify the Google Sign-In prompt appears

### 3.3 Test on Login Page
1. Navigate to `http://localhost:5173/login`
2. You should see:
   - A Google Sign-In button container (rendered by Google)
   - A fallback "Sign in with Google" button
3. Click either button and verify the Google Sign-In prompt appears

### 3.4 Complete a Sign-In
1. Click the Google Sign-In button
2. Select your Google account
3. You should be redirected to the home page
4. Check browser console for success message: `"Google Sign-In successful: {...}"`

## Step 4: Verify Data Storage

After successful sign-in, check that data is stored:

```javascript
// Open browser DevTools (F12) → Console
localStorage.getItem('googleToken');      // Should show JWT token
localStorage.getItem('googleUser');       // Should show user data
```

Expected output:
```json
{
  "id": "google_user_id",
  "email": "user@gmail.com",
  "name": "User Name",
  "picture": "https://..."
}
```

## Step 5: Production Deployment

### 5.1 Update Environment Variables
Update your production `.env` file:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_PRODUCTION_CLIENT_ID.apps.googleusercontent.com
```

### 5.2 Update Google Cloud Console
1. Go back to Google Cloud Console
2. Update authorized JavaScript origins to your production domain:
   - `https://yourdomain.com`
3. Update authorized redirect URIs:
   - `https://yourdomain.com/`

### 5.3 Deploy
```bash
npm run build
# Deploy the dist folder to your hosting
```

## Troubleshooting

### Issue: "Google Client ID is not set"
**Solution**: Verify `.env.local` exists and contains `VITE_GOOGLE_CLIENT_ID`
```bash
cat .env.local | grep VITE_GOOGLE_CLIENT_ID
```

### Issue: Google Sign-In button doesn't appear
**Solution**: 
1. Check browser console for errors (F12 → Console)
2. Verify the Google script loaded: `window.google?.accounts?.id` should exist
3. Ensure your Client ID is correct

### Issue: "Invalid Client ID" error
**Solution**:
1. Verify the Client ID in `.env.local` matches Google Cloud Console
2. Check that your domain is in the authorized origins list
3. Ensure the Client ID hasn't been regenerated

### Issue: Sign-In works but user data not stored
**Solution**:
1. Check browser console for errors
2. Verify `localStorage` is not disabled
3. Check that the callback function is properly set up

### Issue: CORS errors
**Solution**:
1. This is normal for Google OAuth - Google handles CORS
2. If you see CORS errors in console, they're usually not blocking the flow
3. Check the actual error message in the Network tab

## API Integration (Backend)

For production, you should validate the Google token on your backend:

### Backend Validation Example (Node.js/Express)

```typescript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload?.email_verified) {
      throw new Error('Email not verified');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}
```

### Frontend Integration

Update your login flow to validate on backend:

```typescript
const handleGoogleSignIn = async (response: any) => {
  try {
    const userData = handleGoogleSignInResponse(response);
    
    // Validate token on backend
    const backendResponse = await fetch('/api/auth/google/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: userData.token }),
      credentials: 'include',
    });

    if (!backendResponse.ok) {
      throw new Error('Backend validation failed');
    }

    const result = await backendResponse.json();
    
    // Store session token from backend
    localStorage.setItem('sessionToken', result.sessionToken);
    
    // Redirect to home
    navigate('/');
  } catch (error) {
    console.error('Sign-in failed:', error);
  }
};
```

## Security Best Practices

1. **Always validate tokens on the backend** - Never trust client-side token validation
2. **Use HTTPS in production** - Google OAuth requires secure connections
3. **Store tokens securely** - Use HTTP-only cookies for session tokens
4. **Implement CSRF protection** - Use state parameter for OAuth flow
5. **Rate limit authentication endpoints** - Prevent brute force attacks
6. **Log authentication events** - Monitor for suspicious activity
7. **Rotate secrets regularly** - Update Client ID/Secret periodically

## File Changes Summary

### Modified Files:
1. **src/services/googleOAuthService.ts**
   - Added `GoogleUser` interface
   - Improved `initializeGoogleOAuth()` with Promise-based initialization
   - Added `renderGoogleSignInButton()` function
   - Added `triggerGoogleSignInPrompt()` function
   - Better error handling and logging

2. **src/components/pages/HomePage.tsx**
   - Added Google OAuth initialization
   - Added "Sign In with Google" button in hero section
   - Integrated Google One Tap UI

3. **src/components/pages/LoginPage.tsx**
   - Improved Google OAuth initialization
   - Added proper callback handling
   - Integrated Google Sign-In button rendering
   - Added Chrome icon for Google button

## Testing Checklist

- [ ] Google Client ID is set in `.env.local`
- [ ] Development server starts without errors
- [ ] Home page displays "Sign In with Google" button
- [ ] Login page displays Google Sign-In button
- [ ] Clicking button triggers Google Sign-In prompt
- [ ] Sign-in completes successfully
- [ ] User data is stored in localStorage
- [ ] User is redirected to home page after sign-in
- [ ] Console shows success message
- [ ] No CORS errors in console
- [ ] Production domain is added to Google Cloud Console
- [ ] Production environment variables are set

## Next Steps

1. **Backend Integration** - Implement token validation on your backend
2. **User Database** - Store user data in your database after sign-in
3. **Session Management** - Implement proper session handling with cookies
4. **Profile Page** - Display user information from Google on profile page
5. **Logout** - Implement logout functionality that clears session

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
3. Check browser console for detailed error messages
4. Verify all environment variables are correctly set

## References

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
