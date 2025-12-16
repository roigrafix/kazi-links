# Google OAuth Setup Guide for KaziLinks

This guide will help you set up Google OAuth for the KaziLinks application.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter "KaziLinks" as the project name
5. Click "CREATE"
6. Wait for the project to be created (this may take a few moments)

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and then click "ENABLE"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" as the user type
   - Fill in the required fields:
     - App name: "KaziLinks"
     - User support email: Your email
     - Developer contact: Your email
   - Click "SAVE AND CONTINUE"
   - On the "Scopes" page, click "SAVE AND CONTINUE"
   - On the "Test users" page, add your email as a test user
   - Click "SAVE AND CONTINUE"
   - Review and click "BACK TO DASHBOARD"

4. Now create the OAuth client ID:
   - Click "CREATE CREDENTIALS" > "OAuth client ID"
   - Select "Web application"
   - Name it "KaziLinks Web Client"
   - Add Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `http://localhost:5173` (for Vite dev server)
     - Your production domain (e.g., `https://kazilinks.com`)
   - Add Authorized redirect URIs:
     - `http://localhost:3000/` (for local development)
     - `http://localhost:5173/` (for Vite dev server)
     - Your production domain (e.g., `https://kazilinks.com/`)
   - Click "CREATE"

5. Copy your Client ID - you'll need this for the next step

## Step 4: Add Google Client ID to Your Environment

1. Create or update your `.env.local` file in the project root:
   ```
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
   ```

2. Replace `YOUR_CLIENT_ID_HERE` with the Client ID you copied in Step 3

## Step 5: Install Google OAuth Library

The Google OAuth library is already included in the project. If you need to reinstall it:

```bash
npm install @react-oauth/google
```

## Step 6: Verify the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page (`/login`)

3. Click "Sign in with Google"

4. You should see the Google sign-in popup

5. Sign in with your Google account

## Troubleshooting

### "Invalid Client ID" Error
- Make sure your Client ID is correctly set in the `.env.local` file
- Verify that your localhost URL is added to the Authorized JavaScript origins in Google Cloud Console

### CORS Errors
- Make sure your domain is added to the Authorized JavaScript origins
- Check that the redirect URI matches exactly (including trailing slash)

### Popup Blocked
- Make sure you're clicking the button directly (not through a timeout or async operation)
- Check your browser's popup blocker settings

### Token Validation Fails
- Make sure your Client ID is correct
- Verify that the token is being sent to your backend correctly
- Check that your backend is validating the token with Google's servers

## Production Deployment

When deploying to production:

1. Update your Google Cloud Console credentials:
   - Add your production domain to Authorized JavaScript origins
   - Add your production domain to Authorized redirect URIs

2. Update your environment variables:
   - Set `VITE_GOOGLE_CLIENT_ID` to your production Client ID

3. Test the OAuth flow on your production domain

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google Library](https://www.npmjs.com/package/@react-oauth/google)
- [Google Cloud Console](https://console.cloud.google.com/)
