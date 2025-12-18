# SMS OTP Delivery Troubleshooting Guide

## Problem: SMS Messages Not Being Delivered for OTP Verification

This guide will help you diagnose and fix SMS delivery issues on the booking page.

---

## Root Cause Analysis

The SMS OTP functionality was using a **mock implementation** instead of the actual Twilio service. This has been fixed, but SMS delivery requires proper configuration.

### What Was Wrong:
- ❌ BookingPage.tsx was using a mock `sendOtp()` function
- ❌ No actual SMS service was being called
- ❌ Twilio credentials were not being used

### What's Fixed:
- ✅ BookingPage.tsx now imports and uses `twilioService`
- ✅ Real Twilio API calls are made to send and verify OTPs
- ✅ Proper error handling and logging

---

## Step 1: Verify Twilio Credentials

### Check Your Environment Variables

Your SMS delivery depends on these environment variables being set:

```bash
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_SERVICE_SID=VAd3e1619e0cc8a1296109fb6927e00af2
VITE_TWILIO_PHONE_NUMBER=+1234567890  # (optional, for SMS notifications)
```

### Where to Add These:

**For Local Development:**
1. Create a `.env.local` file in the project root
2. Add the environment variables above
3. Restart your development server

**For Production/Deployment:**
1. Add these variables to your deployment platform's environment settings
2. Examples:
   - **Vercel**: Settings → Environment Variables
   - **Netlify**: Site Settings → Build & Deploy → Environment
   - **Docker**: Use `--env` flags or `.env` file
   - **Wix**: Add to your Wix deployment settings

---

## Step 2: Get Your Twilio Credentials

If you don't have Twilio credentials yet:

### 1. Create a Twilio Account
- Go to [twilio.com](https://www.twilio.com)
- Sign up for a free account
- Verify your email and phone number

### 2. Get Your Account SID and Auth Token
- Log in to [Twilio Console](https://www.twilio.com/console)
- Your **Account SID** and **Auth Token** are displayed on the dashboard
- Keep these secure - never commit them to version control

### 3. Create a Verify Service
- Go to **Verify** in the left sidebar
- Click **Create Service**
- Name it (e.g., "Kazi OTP Verification")
- Copy the **Service SID** (starts with `VA`)
- This is your `VITE_TWILIO_SERVICE_SID`

### 4. Get a Twilio Phone Number (Optional)
- Go to **Phone Numbers** → **Manage Numbers**
- Get a phone number for SMS notifications
- This is your `VITE_TWILIO_PHONE_NUMBER`

---

## Step 3: Test the Configuration

### Browser Console Debugging

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try sending an OTP on the booking page
4. Look for these messages:

**Success:**
```
OTP sent successfully to: +919876543210
```

**Configuration Error:**
```
Twilio credentials not found. Check your environment variables.
SMS service is not configured. Please contact support.
```

**API Error:**
```
OTP send failed: [error message from Twilio]
```

### Check Network Requests

1. Go to the **Network** tab in Developer Tools
2. Filter for requests to `verify.twilio.com`
3. Look for a POST request to `/v2/Services/VA.../Verifications`
4. Check the response status:
   - **200**: Success
   - **401**: Invalid credentials
   - **400**: Invalid phone number format
   - **429**: Rate limited

---

## Step 4: Common Issues and Solutions

### Issue 1: "SMS service is not configured"

**Cause:** Environment variables are not set

**Solution:**
```bash
# 1. Check your .env.local file exists
ls -la .env.local

# 2. Verify the variables are set correctly
cat .env.local | grep VITE_TWILIO

# 3. Restart your development server
# (Vite needs to reload environment variables)
```

### Issue 2: "Invalid phone number format"

**Cause:** Phone number is not in E.164 format

**Solution:**
- The service expects: `+919876543210` (with country code)
- The form accepts: `9876543210` (10 digits)
- The code automatically converts it - if this fails, check:
  - Phone number is exactly 10 digits
  - Starts with 6-9 (valid Indian number)

### Issue 3: "Invalid OTP" error

**Cause:** OTP code is incorrect or expired

**Solution:**
- OTPs are valid for 10 minutes by default
- Check that you're entering the correct 6-digit code
- Try resending if it's been more than 10 minutes

### Issue 4: "401 Unauthorized"

**Cause:** Invalid Twilio credentials

**Solution:**
```bash
# 1. Verify your credentials in Twilio Console
# 2. Check for typos in environment variables
# 3. Make sure you're using the correct Account SID (not Service SID)
# 4. Ensure Auth Token hasn't expired
# 5. Restart your development server after updating credentials
```

### Issue 5: "429 Too Many Requests"

**Cause:** Rate limiting - too many OTP requests

**Solution:**
- Wait a few minutes before trying again
- Twilio has rate limits to prevent abuse
- Default: 5 verification attempts per phone number per 10 minutes

---

## Step 5: Verify SMS Delivery

### Test with a Real Phone Number

1. Go to the booking page
2. Enter your actual phone number
3. Click "Send OTP"
4. Check your phone for an SMS message
5. The message should contain a 6-digit code

### Monitor Twilio Console

1. Log in to [Twilio Console](https://www.twilio.com/console)
2. Go to **Verify** → **Logs**
3. You should see your verification attempts
4. Check the status:
   - **Pending**: OTP sent, awaiting verification
   - **Approved**: OTP verified successfully
   - **Failed**: OTP verification failed

---

## Step 6: Production Deployment

### Before Going Live

1. **Test thoroughly** with real phone numbers
2. **Set environment variables** on your deployment platform
3. **Monitor Twilio usage** to avoid unexpected charges
4. **Set up alerts** for failed verifications

### Deployment Checklist

- [ ] Twilio credentials added to production environment
- [ ] `VITE_TWILIO_ACCOUNT_SID` is set
- [ ] `VITE_TWILIO_AUTH_TOKEN` is set
- [ ] `VITE_TWILIO_SERVICE_SID` is set
- [ ] Tested OTP sending and verification
- [ ] Monitored Twilio console for errors
- [ ] Set up error logging/monitoring

---

## Code Changes Made

### BookingPage.tsx
- ✅ Added import: `import { twilioService } from '@/services/twilioService';`
- ✅ Updated `sendOtp()` to use real Twilio API
- ✅ Updated `verifyOtp()` to use real Twilio API
- ✅ Added configuration checks and error handling
- ✅ Added detailed console logging for debugging

### Key Functions

**sendOtp():**
```typescript
// Checks if Twilio is configured
if (!twilioService.isConfigured()) {
  setOtpError('SMS service is not configured...');
  return;
}

// Formats phone number to E.164 format
const formattedPhone = twilioService.formatPhoneNumber(formData.clientPhone);

// Sends OTP via Twilio
const result = await twilioService.sendOTP(formattedPhone);
```

**verifyOtp():**
```typescript
// Verifies OTP via Twilio
const result = await twilioService.verifyOTP(formattedPhone, otpCode);

if (result.success && result.valid) {
  setPhoneVerified(true);
  // Proceed with booking
}
```

---

## Debugging Checklist

Use this checklist to diagnose SMS delivery issues:

- [ ] Environment variables are set in `.env.local` (development) or deployment platform
- [ ] Twilio Account SID is correct (starts with `AC`)
- [ ] Twilio Auth Token is correct and not expired
- [ ] Twilio Service SID is correct (starts with `VA`)
- [ ] Phone number is in valid Indian format (10 digits, starts with 6-9)
- [ ] Development server was restarted after adding environment variables
- [ ] Browser console shows no errors
- [ ] Network tab shows successful request to `verify.twilio.com`
- [ ] Twilio console shows the verification attempt
- [ ] Phone receives the SMS message

---

## Support Resources

### Twilio Documentation
- [Verify Service Docs](https://www.twilio.com/docs/verify/api)
- [Phone Number Formats](https://www.twilio.com/docs/glossary/what-e164)
- [Error Codes](https://www.twilio.com/docs/verify/api/verification-checks#error-codes)

### Common Twilio Errors
- **20003**: Invalid phone number
- **20005**: Invalid verification code
- **20429**: Too many requests
- **21608**: Phone number not allowed

---

## Next Steps

1. **Set up Twilio credentials** in your environment
2. **Restart your development server**
3. **Test OTP sending** on the booking page
4. **Monitor the browser console** for any errors
5. **Check Twilio console** for verification logs
6. **Deploy to production** once testing is complete

If you continue to experience issues, check the browser console and Twilio console logs for specific error messages.
