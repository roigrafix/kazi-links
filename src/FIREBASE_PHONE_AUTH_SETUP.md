# Firebase Phone Authentication Setup Guide

## Overview
This guide explains how to set up Firebase Phone Authentication for your KaziLinks application. Users can now log in with either:
- **Email** (via Wix Members) - `/login`
- **Phone Number** (via Firebase) - `/firebase-phone-auth`

## What Changed

### Removed
- ❌ Twilio SMS OTP service (`SMSAuthPage.tsx`)
- ❌ Twilio service integration
- ❌ `/sms-auth` route

### Added
- ✅ Firebase Phone Authentication service
- ✅ `FirebasePhoneAuthPage.tsx` - New phone login page
- ✅ `/firebase-phone-auth` route
- ✅ Phone login button on main login page
- ✅ reCAPTCHA integration for security

## Prerequisites

1. **Firebase Project** - Already configured in `firebaseAuth.ts`
2. **Firebase Console Access** - https://console.firebase.google.com
3. **Phone Authentication Enabled** - In Firebase Console

## Step 1: Enable Phone Authentication in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **kazilinks-95d1d**
3. Navigate to **Authentication** → **Sign-in method**
4. Click **Phone** and enable it
5. Save changes

## Step 2: Configure reCAPTCHA

Firebase Phone Authentication uses reCAPTCHA v3 for security.

### Option A: Automatic (Recommended)
Firebase will automatically handle reCAPTCHA setup. No additional configuration needed.

### Option B: Manual Configuration
If you want to use a specific reCAPTCHA key:

1. Go to **Firebase Console** → **Authentication** → **Settings**
2. Scroll to **reCAPTCHA Enterprise**
3. Click **Create** or select existing reCAPTCHA key
4. Configure domain restrictions (add your domain)

## Step 3: Test Phone Authentication

### Local Testing
1. Start your development server
2. Navigate to `/login`
3. Click **"Sign in with Phone"**
4. Enter a test phone number (e.g., `+91 98765 43210`)
5. Firebase will send an OTP to the phone number
6. Enter the OTP to verify

### Test Phone Numbers (Development)
Firebase provides test phone numbers for development:
- Go to **Firebase Console** → **Authentication** → **Settings**
- Scroll to **Test phone numbers and passwords**
- Add test numbers with custom OTP codes

Example test setup:
- Phone: `+91 9876543210`
- OTP: `123456`

## Step 4: Production Deployment

### Before Going Live

1. **Verify Domain**
   - Add your production domain to Firebase Console
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your domain (e.g., `kazilinks.com`)

2. **Remove Test Phone Numbers**
   - Delete all test phone numbers from Firebase Console
   - Only real phone numbers will work in production

3. **Configure reCAPTCHA**
   - Ensure reCAPTCHA is properly configured for your domain
   - Test on production domain before full rollout

4. **SMS Quotas**
   - Firebase has SMS quotas (check your plan)
   - Monitor usage in Firebase Console

## File Structure

```
src/
├── services/
│   └── firebaseAuth.ts          # Firebase auth service (updated)
├── components/pages/
│   ├── LoginPage.tsx            # Main login page (updated)
│   └── FirebasePhoneAuthPage.tsx # New phone auth page
└── components/
    └── Router.tsx               # Routes (updated)
```

## API Reference

### firebaseAuth Service

```typescript
import firebaseAuth from '@/services/firebaseAuth';

// Send verification code to phone number
const result = await firebaseAuth.sendPhoneVerificationCode(
  '+91 98765 43210',
  'recaptcha-container'
);

if (result.success && result.confirmationResult) {
  // OTP sent successfully
  const confirmationResult = result.confirmationResult;
}

// Verify OTP code
const verifyResult = await firebaseAuth.verifyPhoneOTP(
  confirmationResult,
  '123456'
);

if (verifyResult.success && verifyResult.user) {
  // Phone verified successfully
  const user = verifyResult.user;
}

// Clear reCAPTCHA
firebaseAuth.clearRecaptcha();
```

## Linking Firebase Phone Auth to Wix Members

Currently, Firebase phone authentication creates a Firebase user. To link it with Wix Members:

### Option 1: Automatic Linking (Recommended)
After successful phone verification, automatically create/link a Wix Members account:

```typescript
// In FirebasePhoneAuthPage.tsx after successful OTP verification
if (result.success && result.user) {
  // Get phone number from Firebase user
  const phoneNumber = result.user.phoneNumber;
  
  // Create/link Wix Members account
  // (Implementation depends on your Wix Members setup)
  
  // Redirect to home
  navigate('/');
}
```

### Option 2: Manual Linking
Users can manually link their phone to Wix Members in their profile settings.

## Troubleshooting

### Issue: "reCAPTCHA not initialized"
**Solution**: Ensure the reCAPTCHA container element exists:
```html
<div id="recaptcha-container"></div>
```

### Issue: "Invalid phone number format"
**Solution**: Phone numbers must be in E.164 format:
- ✅ Correct: `+91 98765 43210`
- ❌ Wrong: `98765 43210` (missing country code)

### Issue: "OTP not received"
**Solution**:
1. Check phone number format
2. Verify phone number is not in test list (production)
3. Check Firebase SMS quota
4. Ensure Firebase project has billing enabled

### Issue: "reCAPTCHA quota exceeded"
**Solution**:
1. Check reCAPTCHA quota in Firebase Console
2. Upgrade Firebase plan if needed
3. Implement rate limiting on frontend

## Security Best Practices

1. **Never expose Firebase config** - Already secured in `firebaseAuth.ts`
2. **Use reCAPTCHA** - Prevents automated attacks
3. **Validate phone numbers** - E.164 format required
4. **Rate limiting** - Implement on backend if needed
5. **HTTPS only** - Required for production
6. **Monitor suspicious activity** - Check Firebase Console logs

## Monitoring & Analytics

Monitor phone authentication in Firebase Console:
1. Go to **Authentication** → **Sign-in method** → **Phone**
2. View sign-in counts and error rates
3. Check **Logs** for detailed activity

## Migration from Twilio

If you were using Twilio SMS OTP:
1. ✅ Removed `SMSAuthPage.tsx`
2. ✅ Removed `/sms-auth` route
3. ✅ Removed Twilio service integration
4. ✅ Replaced with Firebase Phone Auth

Users will need to use the new `/firebase-phone-auth` page for phone login.

## Support & Resources

- [Firebase Phone Authentication Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Console](https://console.firebase.google.com)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)

## Next Steps

1. ✅ Enable Phone Authentication in Firebase Console
2. ✅ Test with test phone numbers
3. ✅ Configure reCAPTCHA for your domain
4. ✅ Deploy to production
5. ✅ Monitor usage and errors
6. ✅ (Optional) Link Firebase phone auth to Wix Members accounts

---

**Last Updated**: December 15, 2025
**Status**: Ready for Production
