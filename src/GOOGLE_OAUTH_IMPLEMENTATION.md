# Google OAuth Implementation Guide - KaziLinks

This document provides a complete guide to implementing Google OAuth for the KaziLinks application.

## Overview

Google OAuth has been integrated into the KaziLinks login and sign-up pages. The implementation includes:

- ✅ Google Sign-In SDK initialization
- ✅ Token handling and decoding
- ✅ User data extraction from Google tokens
- ✅ Integration with both Login and Sign-Up pages
- ✅ Error handling and user feedback

## Files Created/Modified

### New Files:
1. **`/src/services/googleOAuthService.ts`** - Core Google OAuth service
2. **`/src/GOOGLE_OAUTH_SETUP.md`** - Setup instructions
3. **`/src/GOOGLE_OAUTH_IMPLEMENTATION.md`** - This file

### Modified Files:
1. **`/src/components/pages/LoginPage.tsx`** - Added Google Sign-In
2. **`/src/components/pages/SignUpPage.tsx`** - Added Google Sign-Up

## Quick Start

### Step 1: Get Your Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized origins and redirect URIs:
   - `http://localhost:3000`
   - `http://localhost:5173`
   - Your production domain
6. Copy your Client ID

### Step 2: Configure Environment Variables

Create or update `.env.local` in your project root:

```bash
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
```

Replace `YOUR_CLIENT_ID_HERE` with your actual Client ID from Google Cloud Console.

### Step 3: Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/login` or `/signup`

3. Click "Sign in with Google" or "Sign up with Google"

4. You should see the Google sign-in popup

5. Sign in with your Google account

## How It Works

### 1. Initialization (`initializeGoogleOAuth`)

When the Login or Sign-Up page loads, the Google OAuth SDK is initialized:

```typescript
initializeGoogleOAuth();
```

This:
- Loads the Google Identity Services library
- Checks for the required `VITE_GOOGLE_CLIENT_ID` environment variable
- Sets up the global Google object

### 2. User Interaction

When the user clicks "Sign in with Google":

```typescript
handleGoogleLogin() // or handleGoogleSignUp()
```

This:
- Checks if Google SDK is loaded
- Renders the Google Sign-In button
- Displays the One Tap UI (if available)
- Handles errors gracefully

### 3. Token Handling

When the user completes the sign-in:

```typescript
handleGoogleResponse(response)
```

This:
- Decodes the JWT token from Google
- Extracts user information (email, name, picture, etc.)
- Stores the token and user data in localStorage
- Redirects to the home page

### 4. Token Decoding

The `decodeToken` function extracts user information from the JWT:

```typescript
const userData = decodeToken(token);
// Returns: { sub, email, name, picture, given_name, family_name, ... }
```

## User Data Available

After successful Google Sign-In, the following user data is available:

```typescript
{
  id: string;           // Google user ID (sub)
  email: string;        // User's email
  name: string;         // Full name
  picture: string;      // Profile picture URL
  givenName: string;    // First name
  familyName: string;   // Last name
  emailVerified: boolean; // Email verification status
  token: string;        // JWT token
}
```

## Storage

User data is stored in localStorage:

```typescript
localStorage.getItem('googleToken')     // JWT token
localStorage.getItem('googleUser')      // User data (JSON)
```

## Error Handling

The implementation includes comprehensive error handling:

- **Missing Client ID**: Shows error message
- **SDK Not Loaded**: Shows error message
- **Token Decoding Failure**: Shows error message
- **Sign-In Failure**: Shows error message with details

All errors are displayed to the user in a styled error box.

## Security Considerations

### Current Implementation (Development)

The current implementation:
- ✅ Decodes the JWT token locally
- ✅ Stores user data in localStorage
- ✅ Validates token structure

### Recommended for Production

For production, you should:

1. **Validate tokens on your backend**:
   ```typescript
   // Backend endpoint
   POST /api/auth/google/verify
   Body: { token: string }
   Response: { valid: boolean, user: {...} }
   ```

2. **Use secure HTTP-only cookies** instead of localStorage:
   ```typescript
   // Backend sets secure cookie
   Set-Cookie: googleToken=...; HttpOnly; Secure; SameSite=Strict
   ```

3. **Implement token refresh** for long-lived sessions

4. **Validate token expiration** (exp claim)

5. **Verify token signature** using Google's public keys

## Backend Integration (Optional)

To validate tokens on your backend, implement this endpoint:

```typescript
// Example: Node.js/Express
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post('/api/auth/google/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    // Create user session
    res.json({ valid: true, user: payload });
  } catch (error) {
    res.status(401).json({ valid: false, error: error.message });
  }
});
```

## Troubleshooting

### "Google Client ID is not set"

**Solution**: Add `VITE_GOOGLE_CLIENT_ID` to your `.env.local` file

### "Google Sign-In is not available"

**Possible causes**:
- SDK failed to load
- Client ID is invalid
- Domain not authorized in Google Cloud Console

**Solution**:
1. Check browser console for errors
2. Verify Client ID in `.env.local`
3. Add your domain to authorized origins in Google Cloud Console

### Popup Blocked

**Solution**:
- Make sure you're clicking the button directly
- Check browser popup blocker settings
- Try using One Tap UI instead

### Token Validation Fails

**Solution**:
1. Check that the token is being sent correctly
2. Verify Client ID matches in Google Cloud Console
3. Check token expiration (tokens expire in 1 hour)

### User Data Not Stored

**Solution**:
1. Check browser localStorage is enabled
2. Verify no errors in browser console
3. Check that `handleGoogleResponse` is being called

## Testing

### Test Cases

1. **Successful Sign-In**:
   - Click "Sign in with Google"
   - Sign in with valid Google account
   - Should redirect to home page
   - User data should be in localStorage

2. **Invalid Client ID**:
   - Set invalid `VITE_GOOGLE_CLIENT_ID`
   - Should show error message

3. **Unauthorized Domain**:
   - Try from unauthorized domain
   - Should show error message

4. **Token Expiration**:
   - Wait for token to expire (1 hour)
   - Should require re-authentication

## Advanced Configuration

### Customize Google Sign-In Button

Edit the button rendering in `handleGoogleLogin`:

```typescript
google.accounts.id.renderButton(
  document.getElementById('google-signin-button'),
  {
    type: 'standard',      // 'standard', 'icon'
    size: 'large',         // 'large', 'medium', 'small'
    text: 'signin_with',   // 'signin_with', 'signup_with', 'signin'
    locale: 'en_US',       // Language code
    theme: 'outline',      // 'outline', 'filled_blue', 'filled_black'
  }
);
```

### Enable One Tap UI

One Tap is automatically enabled. To customize:

```typescript
google.accounts.id.initialize({
  client_id: clientId,
  callback: handleGoogleResponse,
  auto_select: true,           // Auto-select if only one account
  itp_support: true,           // Support for ITP browsers
});

google.accounts.id.prompt((notification) => {
  if (notification.isNotDisplayed()) {
    // One Tap not displayed, show button instead
  }
});
```

### Handle Multiple Accounts

```typescript
google.accounts.id.oneTapPrompt((notification) => {
  if (notification.isNotDisplayed()) {
    // User has multiple accounts or disabled One Tap
    // Show the button instead
  }
});
```

## Migration from Other Auth Methods

If migrating from another authentication method:

1. **Keep existing auth** alongside Google OAuth
2. **Link accounts** by email address
3. **Migrate user data** gradually
4. **Provide fallback** to old auth method

## References

- [Google Identity Services Documentation](https://developers.google.com/identity)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [JWT Token Structure](https://tools.ietf.org/html/rfc7519)
- [Google Cloud Console](https://console.cloud.google.com/)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Check Google Cloud Console configuration
4. Verify environment variables are set correctly

## Next Steps

1. ✅ Set up Google Cloud Project
2. ✅ Get Client ID
3. ✅ Add to `.env.local`
4. ✅ Test on login/signup pages
5. ⏳ (Optional) Implement backend token validation
6. ⏳ (Optional) Implement account linking
7. ⏳ Deploy to production with production domain
