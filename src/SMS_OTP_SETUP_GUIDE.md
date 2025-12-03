# SMS OTP Authentication Setup Guide

This guide explains how to set up and use the Twilio SMS OTP verification system for your application.

## 📋 Overview

The SMS OTP authentication system provides:
- ✅ Phone number verification via SMS
- ✅ 6-digit OTP code generation and validation
- ✅ Resend OTP functionality with countdown timer
- ✅ Secure E.164 phone number formatting
- ✅ Beautiful, responsive UI with real-time feedback
- ✅ Support for multiple countries (India, US, etc.)

## 🔧 Setup Instructions

### Step 1: Get Twilio Credentials

1. **Create a Twilio Account**
   - Go to [Twilio Console](https://www.twilio.com/console)
   - Sign up for a free account
   - Verify your email and phone number

2. **Find Your Account SID and Auth Token**
   - In the Twilio Console, go to **Account** → **API keys & tokens**
   - Copy your **Account SID** (starts with `AC...`)
   - Copy your **Auth Token** (keep this secret!)

3. **Create a Verify Service**
   - Go to **Verify** → **Services** in the Twilio Console
   - Click **Create Service**
   - Name it (e.g., "Service Booking SMS OTP")
   - Select **SMS** as the channel
   - Click **Create**
   - Copy the **Service SID** (should be `VAd3e1619e0cc8a1296109fb6927e00af2` or similar)

### Step 2: Configure Environment Variables

#### For Local Development

Create a `.env.local` file in your project root:

```env
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_SERVICE_SID=VAd3e1619e0cc8a1296109fb6927e00af2
```

**Replace with your actual credentials:**
- `VITE_TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `VITE_TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `VITE_TWILIO_SERVICE_SID` - Your Verify Service SID

#### For Production (Wix Deployment)

Add these environment variables in your Wix deployment settings:

1. Go to your Wix deployment configuration
2. Add the following environment variables:
   - `VITE_TWILIO_ACCOUNT_SID` = Your Account SID
   - `VITE_TWILIO_AUTH_TOKEN` = Your Auth Token
   - `VITE_TWILIO_SERVICE_SID` = Your Service SID

### Step 3: Access the SMS Auth Page

The SMS OTP authentication page is available at:
```
https://your-domain.com/sms-auth
```

## 📱 How It Works

### User Flow

1. **Phone Number Entry**
   - User enters their phone number
   - System formats it to E.164 format (e.g., +91 for India)
   - OTP is sent via SMS

2. **OTP Verification**
   - User receives 6-digit code via SMS
   - User enters the code in the verification form
   - System validates the code with Twilio

3. **Success**
   - User is authenticated
   - Redirected to home page
   - Phone number is verified

### Phone Number Formatting

The system automatically formats phone numbers:

| Input | Output | Country |
|-------|--------|---------|
| 9876543210 | +919876543210 | India |
| +919876543210 | +919876543210 | India |
| 2025551234 | +12025551234 | USA |
| +12025551234 | +12025551234 | USA |

## 🔐 Security Features

1. **Environment Variables**
   - Credentials never hardcoded
   - Secure storage in deployment

2. **Input Validation**
   - Phone number format validation
   - OTP code validation (6 digits only)
   - E.164 format enforcement

3. **Rate Limiting**
   - 60-second cooldown between resend attempts
   - Prevents OTP brute force attacks

4. **Error Handling**
   - Graceful fallback if Twilio not configured
   - Clear error messages to users
   - Detailed logging for debugging

## 📝 API Reference

### TwilioService Methods

#### `sendOTP(phoneNumber: string)`
Sends an OTP to the specified phone number.

```typescript
const result = await twilioService.sendOTP('+919876543210');
// Returns: { success: boolean, message: string, sid?: string }
```

#### `verifyOTP(phoneNumber: string, code: string)`
Verifies the OTP code for a phone number.

```typescript
const result = await twilioService.verifyOTP('+919876543210', '123456');
// Returns: { success: boolean, message: string, valid: boolean }
```

#### `formatPhoneNumber(phoneNumber: string)`
Formats a phone number to E.164 format.

```typescript
const formatted = twilioService.formatPhoneNumber('9876543210');
// Returns: '+919876543210'
```

#### `isConfigured()`
Checks if Twilio credentials are properly configured.

```typescript
if (twilioService.isConfigured()) {
  // SMS OTP is available
}
```

## 🎨 UI Components

### SMSAuthPage Component

Located at: `/src/components/pages/SMSAuthPage.tsx`

Features:
- Beautiful gradient background
- Smooth animations
- Three-step authentication flow
- Real-time countdown timer
- Responsive design for all devices
- Toast notifications for feedback

### Customization

To customize the appearance, edit the component:

```typescript
// Change colors
className="bg-neonyellow" // Change to your brand color

// Change timeout
setTimeLeft(60); // Change 60 to your preferred seconds

// Change redirect
navigate('/'); // Change to your desired page
```

## 🧪 Testing

### Test with Twilio Trial Account

1. **Verify Your Phone Number**
   - In Twilio Console, go to **Phone Numbers** → **Verified Caller IDs**
   - Add your personal phone number
   - Verify via SMS

2. **Send Test OTP**
   - Go to `/sms-auth`
   - Enter your verified phone number
   - You'll receive an SMS with the OTP code

3. **Verify the Code**
   - Enter the 6-digit code
   - System will verify and show success

### Test Error Handling

- **Invalid phone number**: Try entering without country code
- **Invalid OTP**: Enter wrong 6-digit code
- **Expired OTP**: Wait for code to expire and try again
- **Missing credentials**: Remove env variables to test fallback

## 🐛 Troubleshooting

### "SMS OTP service is not configured"

**Solution**: Check that all three environment variables are set:
- `VITE_TWILIO_ACCOUNT_SID`
- `VITE_TWILIO_AUTH_TOKEN`
- `VITE_TWILIO_SERVICE_SID`

### "OTP not received"

**Possible causes**:
1. Phone number format is incorrect
2. Twilio account doesn't have SMS capability
3. Phone number not verified in trial account
4. SMS delivery delayed (can take 1-2 minutes)

**Solution**:
- Verify phone number format (should start with +)
- Check Twilio Console for delivery logs
- Ensure Twilio account has SMS enabled

### "Invalid OTP" error

**Possible causes**:
1. Wrong code entered
2. Code expired (usually 10 minutes)
3. Code already used

**Solution**:
- Click "Resend OTP" to get a new code
- Enter the new code immediately

## 📊 Monitoring

### Check SMS Delivery Logs

In Twilio Console:
1. Go to **Verify** → **Logs**
2. View all OTP delivery attempts
3. Check status (delivered, failed, etc.)

### Monitor Usage

1. Go to **Billing** → **Usage**
2. View SMS costs and delivery statistics
3. Set up alerts for high usage

## 💰 Pricing

**Twilio Verify Pricing** (as of 2024):
- **Free Trial**: $15 free credit
- **Pay-as-you-go**: $0.05 per verification attempt
- **Volume discounts**: Available for high volume

## 🔗 Integration with Your App

### Add SMS Auth Link to Navigation

Edit `/src/components/Layout.tsx`:

```typescript
<Link to="/sms-auth" className="...">
  Verify with SMS
</Link>
```

### Protect Routes with SMS Verification

Create a custom protected route:

```typescript
import { SMSProtectedRoute } from '@/components/ui/sms-protected-route';

<SMSProtectedRoute>
  <YourProtectedPage />
</SMSProtectedRoute>
```

### Store Verified Phone Numbers

After verification, store the phone number:

```typescript
// In your user profile or database
const verifiedPhone = formattedPhone; // +919876543210
await saveUserPhone(userId, verifiedPhone);
```

## 📚 Additional Resources

- [Twilio Verify Documentation](https://www.twilio.com/docs/verify/api)
- [Twilio Console](https://www.twilio.com/console)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
- [SMS Best Practices](https://www.twilio.com/docs/sms/best-practices)

## ⚠️ Important Notes

1. **Never commit credentials** to version control
2. **Keep Auth Token secret** - treat like a password
3. **Monitor usage** to avoid unexpected charges
4. **Test thoroughly** before going to production
5. **Have backup authentication** method in case SMS fails

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Review Twilio Console logs for delivery issues
3. Verify environment variables are set correctly
4. Check that Twilio account has SMS capability
5. Contact Twilio support if SMS not delivering

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Production Ready
