# Wix Messaging Center OTP Implementation Guide

## Overview

This guide explains the unified OTP authentication system using Wix Messaging Center. The system replaces the previous Firebase Phone Auth and Twilio SMS implementations with a single, integrated solution.

## Architecture

### Components

1. **Backend (`/src/backend/messageCentral.jsw`)**
   - Handles OTP generation and verification
   - Manages OTP storage with expiry
   - Integrates with Wix Messaging Center for SMS delivery
   - Updates Wix Contacts with verified phone numbers

2. **Frontend Service (`/src/services/messageCenterOTPService.ts`)**
   - Calls backend functions via `web.callFunction()`
   - Validates phone numbers
   - Handles OTP send/verify/resend operations

3. **UI Page (`/src/components/pages/MessagingCenterOTPPage.tsx`)**
   - Three-step authentication flow: Phone → OTP → Success
   - Responsive design with animations
   - Error handling and user feedback

4. **Verification Service (`/src/services/phoneVerificationService.ts`)**
   - Stores verified phone numbers
   - Manages verification state
   - Provides phone number formatting utilities

## Setup Instructions

### Step 1: Enable Wix Messaging Center

1. Go to your Wix Dashboard
2. Navigate to **Settings → Integrations & Apps**
3. Search for **Messaging Center**
4. Enable the app and configure SMS settings
5. Ensure your Wix account has SMS credits

### Step 2: Configure Backend Functions

The backend functions are already created in `/src/backend/messageCentral.jsw`. The file includes:

- `sendOTP(phoneNumber)` - Sends OTP via SMS
- `verifyOTP(phoneNumber, code)` - Verifies the OTP code
- `resendOTP(phoneNumber)` - Resends OTP
- `clearOTP(phoneNumber)` - Clears OTP (testing only)
- `getOTPStatus(phoneNumber)` - Gets OTP status (testing only)

### Step 3: Update Router

The router has been updated to include the new route:

```typescript
{
  path: "phone-auth",
  element: <MessagingCenterOTPPage />,
}
```

**Old routes removed:**
- `/firebase-phone-auth` (Firebase Phone Auth)
- `/sms-auth` (Twilio SMS Auth)

### Step 4: Test the Implementation

#### Test URL
Navigate to: `https://your-site.com/phone-auth`

#### Test Phone Numbers
Use these test numbers (if supported by Wix Messaging Center):
- `+91 98765 43210` (India)
- `+1 555 123 4567` (USA)

#### Test Flow
1. Enter phone number
2. Receive OTP via SMS
3. Enter OTP code
4. See success message and redirect

## API Reference

### Backend Functions

#### `sendOTP(phoneNumber: string)`

Sends OTP to the specified phone number.

**Parameters:**
- `phoneNumber` (string): Phone number in any format (auto-formatted to E.164)

**Returns:**
```typescript
{
  success: boolean;
  message: string;
  phoneNumber?: string;      // Formatted phone number
  messageId?: string;        // Wix Messaging Center message ID
  isTestMode?: boolean;      // True if in test mode
  otp?: string;             // OTP code (test mode only)
  code?: string;            // Error code if failed
}
```

**Example:**
```javascript
const result = await sendOTP('+91 98765 43210');
// Returns: { success: true, message: "OTP sent...", phoneNumber: "+919876543210" }
```

#### `verifyOTP(phoneNumber: string, code: string)`

Verifies the OTP code for a phone number.

**Parameters:**
- `phoneNumber` (string): Phone number
- `code` (string): 6-digit OTP code

**Returns:**
```typescript
{
  success: boolean;
  valid: boolean;
  message: string;
  phoneNumber?: string;      // Verified phone number
  verifiedAt?: string;       // ISO timestamp
  code?: string;            // Error code if failed
  attemptsRemaining?: number; // Remaining attempts
}
```

**Example:**
```javascript
const result = await verifyOTP('+91 98765 43210', '123456');
// Returns: { success: true, valid: true, message: "Phone number verified...", verifiedAt: "2024-01-01T..." }
```

#### `resendOTP(phoneNumber: string)`

Resends OTP to the phone number.

**Parameters:**
- `phoneNumber` (string): Phone number

**Returns:** Same as `sendOTP()`

### Frontend Service

#### `messageCenterOTPService.sendOTP(phoneNumber: string)`

Calls backend `sendOTP` function.

```typescript
import { messageCenterOTPService } from '@/services/messageCenterOTPService';

const result = await messageCenterOTPService.sendOTP('+91 98765 43210');
```

#### `messageCenterOTPService.verifyOTP(phoneNumber: string, code: string)`

Calls backend `verifyOTP` function.

```typescript
const result = await messageCenterOTPService.verifyOTP('+91 98765 43210', '123456');
```

#### `messageCenterOTPService.formatPhoneNumber(phoneNumber: string)`

Formats phone number to E.164 format.

```typescript
const formatted = messageCenterOTPService.formatPhoneNumber('98765 43210');
// Returns: "+919876543210"
```

#### `messageCenterOTPService.validatePhoneNumber(phoneNumber: string)`

Validates phone number format.

```typescript
const validation = messageCenterOTPService.validatePhoneNumber('+91 98765 43210');
// Returns: { valid: true }
```

## Phone Number Format Support

The system automatically handles various phone number formats:

| Input Format | Output Format | Country |
|---|---|---|
| `98765 43210` | `+919876543210` | India (10 digits) |
| `+91 98765 43210` | `+919876543210` | India (with country code) |
| `919876543210` | `+919876543210` | India (country code, no +) |
| `+1 555 123 4567` | `+15551234567` | USA |

## Error Handling

### Common Error Codes

| Code | Message | Solution |
|---|---|---|
| `INVALID_PHONE` | Invalid phone number | Check phone number format |
| `INVALID_FORMAT` | Phone number must be in valid format | Use E.164 format (e.g., +91...) |
| `OTP_NOT_FOUND` | No OTP found for this phone number | Request a new OTP |
| `OTP_EXPIRED` | OTP has expired | Request a new OTP |
| `INVALID_OTP` | Invalid OTP code | Check the code and try again |
| `MAX_ATTEMPTS_EXCEEDED` | Too many failed attempts | Request a new OTP |
| `SEND_ERROR` | Failed to send OTP | Check Messaging Center configuration |
| `VERIFY_ERROR` | Failed to verify OTP | Try again or request new OTP |

## Security Features

1. **OTP Expiry**: OTPs expire after 5 minutes
2. **Attempt Limiting**: Maximum 5 verification attempts per OTP
3. **Phone Number Verification**: Verified phone numbers are stored in Wix Contacts
4. **Session Storage**: Verified phone numbers stored in session for immediate use
5. **HTTPS Only**: All communications are encrypted

## Integration with Wix Members

After successful OTP verification, the verified phone number is:

1. Stored in Wix Contacts database
2. Saved to session storage for immediate access
3. Available for future reference in user profiles

To access the verified phone number:

```typescript
import { phoneVerificationService } from '@/services/phoneVerificationService';

// Check if phone is verified
const isVerified = phoneVerificationService.isPhoneVerified();

// Get verified phone number
const phoneNumber = phoneVerificationService.getVerifiedPhoneNumber();

// Get full verification data
const data = phoneVerificationService.getVerificationData();
```

## Testing

### Manual Testing

1. Navigate to `/phone-auth`
2. Enter a valid phone number
3. Check SMS for OTP code
4. Enter OTP code
5. Verify success message

### Automated Testing (if needed)

Use the test endpoints:

```typescript
// Get OTP status
const status = await messageCenterOTPService.getOTPStatus('+91 98765 43210');

// Clear OTP (testing only)
await messageCenterOTPService.clearOTP('+91 98765 43210');
```

## Troubleshooting

### OTP Not Received

1. Check Wix Messaging Center is enabled
2. Verify SMS credits are available
3. Confirm phone number format is correct
4. Check spam folder for SMS

### OTP Verification Fails

1. Ensure OTP hasn't expired (5 minute limit)
2. Check you haven't exceeded 5 attempts
3. Verify you're entering the correct code
4. Request a new OTP if needed

### Backend Function Not Found

1. Ensure `/src/backend/messageCentral.jsw` exists
2. Check file is properly formatted
3. Rebuild/redeploy the application
4. Check browser console for errors

## Migration from Old Systems

### From Firebase Phone Auth

**Old route:** `/firebase-phone-auth`
**New route:** `/phone-auth`

Update any links or redirects:

```typescript
// Old
navigate('/firebase-phone-auth');

// New
navigate('/phone-auth');
```

### From Twilio SMS Auth

**Old route:** `/sms-auth`
**New route:** `/phone-auth`

The new system handles all SMS delivery through Wix Messaging Center.

## Production Checklist

- [ ] Wix Messaging Center enabled and configured
- [ ] SMS credits available
- [ ] Backend functions deployed
- [ ] Frontend service integrated
- [ ] Router updated with new route
- [ ] Old routes removed or redirected
- [ ] Phone number verification working
- [ ] Error handling tested
- [ ] Security features verified
- [ ] Documentation updated

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check Wix Messaging Center logs
4. Verify backend function logs

## References

- [Wix Messaging Center API](https://www.wix.com/velo/reference/wix-messaging-backend)
- [Wix Contacts API](https://www.wix.com/velo/reference/wix-crm-backend/contacts)
- [E.164 Phone Number Format](https://en.wikipedia.org/wiki/E.164)
