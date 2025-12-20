# Firebase SDK Installation Guide

## Problem
You're seeing the error: **"Failed to resolve import 'firebase/app'"**

This error occurs because the Firebase SDK is not installed in your project dependencies.

## Solution

### Step 1: Install Firebase SDK

Run the following command in your project root directory:

```bash
npm install firebase
```

Or if you're using yarn:

```bash
yarn add firebase
```

### Step 2: Verify Installation

After installation, verify that Firebase is added to your `package.json`:

```bash
npm list firebase
```

You should see output like:
```
your-project@1.0.0
└── firebase@10.x.x (or latest version)
```

### Step 3: Configure Firebase Credentials

Create or update your `.env.local` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on **Settings** (gear icon) → **Project Settings**
4. Under the **General** tab, scroll down to find your **Web API Key** and other credentials
5. Copy each value and paste it into your `.env.local` file

### Step 5: Restart Your Development Server

After installing Firebase and configuring credentials, restart your development server:

```bash
npm run dev
```

## Troubleshooting

### Still Getting "Cannot find module" Error?

1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check if Firebase is in package.json:**
   ```bash
   cat package.json | grep firebase
   ```

3. **Verify .env.local exists:**
   ```bash
   ls -la .env.local
   ```

### Firebase Credentials Not Working?

1. Ensure all environment variables are set correctly in `.env.local`
2. Restart your development server after updating `.env.local`
3. Check that your Firebase project has **Phone Authentication** enabled:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable "Phone"

### Phone Authentication Not Enabled?

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Phone** and enable it
5. Add your test phone numbers if needed

## What Gets Installed?

The `firebase` package includes:
- ✅ Firebase Authentication (for phone OTP verification)
- ✅ Firebase Realtime Database
- ✅ Firebase Cloud Firestore
- ✅ Firebase Storage
- ✅ And more...

For this project, we're using **Firebase Authentication** for phone number verification with OTP.

## File Locations

- **Service:** `/src/services/googlePhoneAuthService.ts`
- **Usage:** `/src/components/pages/BookingPage.tsx` (in the phone verification section)
- **Environment Config:** `.env.local` (create if doesn't exist)

## Next Steps

After installing Firebase:

1. ✅ The "Send OTP" button will be active on the booking page
2. ✅ Users can verify their phone numbers with OTP
3. ✅ Phone verification is required before booking confirmation

## Support

If you encounter any issues:

1. Check the browser console for error messages
2. Verify all Firebase credentials are correct
3. Ensure Firebase project has Phone Authentication enabled
4. Check that `.env.local` is in the project root (not in `/src`)

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to version control
- Add `.env.local` to your `.gitignore` file
- Keep your Firebase API keys private
- Use Firebase Security Rules to protect your data

## Package Version

This project uses Firebase SDK v10.x or later. Check your `package.json` for the exact version:

```bash
npm view firebase version
```
