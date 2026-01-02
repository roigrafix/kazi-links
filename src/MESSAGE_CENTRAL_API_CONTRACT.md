# Message Central OTP - API Contract & Integration Guide

## 🔗 Complete Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│                  MessagingCenterOTPPage.tsx                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND SERVICE LAYER                            │
│              messageCenterOTPService.ts                              │
│  - sendOTP(phoneNumber)                                             │
│  - verifyOTP(phoneNumber, code, verificationId)                     │
│  - resendOTP(phoneNumber)                                           │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      HTTP ENDPOINTS                                  │
│              /_functions/sendOTP                                     │
│              /_functions/verifyOTP                                   │
│              /_functions/resendOTP                                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICE LAYER                             │
│                  messageCentral.jsw                                  │
│  - sendOTP(phoneNumber)                                             │
│  - verifyOTP(phoneNumber, code, verificationId)                     │
│  - resendOTP(phoneNumber)                                           │
│  - clearOTP(phoneNumber)                                            │
│  - getOTPStatus(phoneNumber)                                        │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   ┌─────────┐      ┌──────────────┐    ┌──────────┐
   │   Wix   │      │   Message    │    │   Wix    │
   │ Secrets │      │   Central    │    │   CRM    │
   │ Manager │      │   API        │    │ Backend  │
   └─────────┘      └──────────────┘    └──────────┘
```

## 📡 HTTP Endpoints

### 1. Send OTP

**Endpoint:** `POST /_functions/sendOTP`

**Request:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent successfully to +919876543210",
  "phoneNumber": "+919876543210",
  "messageId": "msg_123456",
  "data": {
    "verificationId": "vid_1704206002463_a1b2c3d4e5"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Phone number must be in valid format (e.g., +91 for India)",
  "code": "INVALID_FORMAT",
  "data": {}
}
```

**Status Codes:**
- `200 OK` - Request processed (check `success` field)
- `400 Bad Request` - Invalid request format
- `500 Internal Server Error` - Server error

---

### 2. Verify OTP

**Endpoint:** `POST /_functions/verifyOTP`

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "code": "123456",
  "verificationId": "vid_1704206002463_a1b2c3d4e5"
}
```

**Response (Success):**
```json
{
  "success": true,
  "valid": true,
  "message": "Phone number verified successfully",
  "phoneNumber": "+919876543210",
  "verifiedAt": "2024-01-02T17:53:22.463Z"
}
```

**Response (Error - Invalid Code):**
```json
{
  "success": false,
  "valid": false,
  "message": "Invalid OTP code",
  "code": "MC_VERIFY_ERROR",
  "attemptsRemaining": 3
}
```

**Response (Error - Invalid Verification ID):**
```json
{
  "success": false,
  "valid": false,
  "message": "Invalid verification ID. Please request a new OTP.",
  "code": "INVALID_VERIFICATION_ID"
}
```

**Response (Error - Missing Parameters):**
```json
{
  "success": false,
  "valid": false,
  "message": "Phone number, OTP code, and verification ID are required",
  "code": "MISSING_PARAMS"
}
```

**Status Codes:**
- `200 OK` - Request processed (check `valid` field)
- `400 Bad Request` - Invalid request format
- `500 Internal Server Error` - Server error

---

### 3. Resend OTP

**Endpoint:** `POST /_functions/resendOTP`

**Request:**
```json
{
  "phoneNumber": "+919876543210"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP resent successfully to +919876543210",
  "phoneNumber": "+919876543210",
  "messageId": "msg_789012",
  "data": {
    "verificationId": "vid_1704206062789_x9y8z7w6v5"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Phone number must be in valid format (e.g., +91 for India)",
  "code": "INVALID_FORMAT",
  "data": {}
}
```

**Status Codes:**
- `200 OK` - Request processed (check `success` field)
- `400 Bad Request` - Invalid request format
- `500 Internal Server Error` - Server error

---

## 🔐 Backend Functions

### sendOTP(phoneNumber)

**Location:** `/src/backend/messageCentral.jsw`

**Signature:**
```javascript
export async function sendOTP(phoneNumber)
```

**Parameters:**
- `phoneNumber` (string) - Phone number in any format (will be formatted to E.164)

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  phoneNumber: string,
  messageId: string,
  data: {
    verificationId: string  // From Message Central API
  }
}
```

**Process:**
1. Validate phone number format
2. Format to E.164 format
3. Fetch MC credentials from Wix Secrets Manager
4. Call Message Central `/otp/send` API
5. Extract `verificationId` from MC response
6. Return response with verification ID

**Error Codes:**
- `INVALID_PHONE` - Phone number is empty or not a string
- `INVALID_FORMAT` - Phone number not in valid E.164 format
- `MC_SEND_ERROR` - Message Central API returned error
- `MISSING_VERIFICATION_ID` - MC didn't return verification ID
- `SEND_ERROR` - Unexpected error

---

### verifyOTP(phoneNumber, code, verificationId)

**Location:** `/src/backend/messageCentral.jsw`

**Signature:**
```javascript
export async function verifyOTP(phoneNumber, code, verificationId)
```

**Parameters:**
- `phoneNumber` (string) - Phone number in any format
- `code` (string) - 6-digit OTP code
- `verificationId` (string) - Verification ID from sendOTP response

**Returns:**
```javascript
{
  success: boolean,
  valid: boolean,
  message: string,
  phoneNumber: string,
  verifiedAt: string,
  attemptsRemaining?: number
}
```

**Process:**
1. Validate all three parameters are provided
2. Validate code is 6 digits
3. Format phone number to E.164
4. Fetch MC credentials from Wix Secrets Manager
5. Call Message Central `/otp/verify` API with verification ID
6. If valid:
   - Query Wix CRM for existing contact
   - Create new contact or update existing
   - Mark phone as verified
   - Record verification timestamp
7. Return success/failure response

**Error Codes:**
- `MISSING_PARAMS` - Missing phoneNumber, code, or verificationId
- `INVALID_FORMAT` - Code not 6 digits or not numeric
- `MC_VERIFY_ERROR` - Message Central API returned error
- `VERIFY_ERROR` - Unexpected error

---

### resendOTP(phoneNumber)

**Location:** `/src/backend/messageCentral.jsw`

**Signature:**
```javascript
export async function resendOTP(phoneNumber)
```

**Parameters:**
- `phoneNumber` (string) - Phone number in any format

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  phoneNumber: string,
  messageId: string,
  data: {
    verificationId: string  // NEW verification ID from Message Central
  }
}
```

**Process:**
1. Validate phone number format
2. Format to E.164 format
3. Fetch MC credentials from Wix Secrets Manager
4. Call Message Central `/otp/resend` API
5. Extract NEW `verificationId` from MC response
6. Return response with new verification ID

**Important:** Returns a NEW verification ID. Frontend must update stored verification ID.

**Error Codes:**
- `INVALID_PHONE` - Phone number is empty or not a string
- `INVALID_FORMAT` - Phone number not in valid E.164 format
- `MC_RESEND_ERROR` - Message Central API returned error
- `MISSING_VERIFICATION_ID` - MC didn't return new verification ID
- `RESEND_ERROR` - Unexpected error

---

### clearOTP(phoneNumber)

**Location:** `/src/backend/messageCentral.jsw`

**Signature:**
```javascript
export async function clearOTP(phoneNumber)
```

**Parameters:**
- `phoneNumber` (string) - Phone number in any format

**Returns:**
```javascript
{
  success: boolean,
  message: string
}
```

**Process:**
1. Validate phone number
2. Format to E.164 format
3. Fetch MC credentials from Wix Secrets Manager
4. Call Message Central `/otp/clear` API
5. Return success/failure response

**Note:** For testing/cleanup only. Message Central manages OTP lifecycle.

---

### getOTPStatus(phoneNumber)

**Location:** `/src/backend/messageCentral.jsw`

**Signature:**
```javascript
export async function getOTPStatus(phoneNumber)
```

**Parameters:**
- `phoneNumber` (string) - Phone number in any format

**Returns:**
```javascript
{
  exists: boolean,
  expiresAt?: string,
  attempts?: number,
  maxAttempts?: number,
  isExpired?: boolean
}
```

**Process:**
1. Validate phone number
2. Format to E.164 format
3. Fetch MC credentials from Wix Secrets Manager
4. Call Message Central `/otp/status` API
5. Return status information

**Note:** For testing/debugging only. Not used in production flow.

---

## 🔌 Frontend Service Layer

### messageCenterOTPService

**Location:** `/src/services/messageCenterOTPService.ts`

**Methods:**

#### sendOTP(phoneNumber)
```typescript
async sendOTP(phoneNumber: string): Promise<OTPResponse>
```

**Usage:**
```typescript
const result = await messageCenterOTPService.sendOTP('+919876543210');
if (result.success) {
  const verificationId = result.data?.verificationId;
  // Store verification ID for later use
}
```

#### verifyOTP(phoneNumber, code, verificationId)
```typescript
async verifyOTP(
  phoneNumber: string, 
  code: string, 
  verificationId: string
): Promise<VerifyResponse>
```

**Usage:**
```typescript
const result = await messageCenterOTPService.verifyOTP(
  '+919876543210',
  '123456',
  'vid_1704206002463_a1b2c3d4e5'
);
if (result.success && result.valid) {
  // Phone verified successfully
}
```

#### resendOTP(phoneNumber)
```typescript
async resendOTP(phoneNumber: string): Promise<OTPResponse>
```

**Usage:**
```typescript
const result = await messageCenterOTPService.resendOTP('+919876543210');
if (result.success) {
  const newVerificationId = result.data?.verificationId;
  // Update stored verification ID with new one
}
```

---

## 🎯 Frontend Component Integration

### MessagingCenterOTPPage.tsx

**State Management:**
```typescript
const [phoneNumber, setPhoneNumber] = useState('');
const [otp, setOtp] = useState('');
const [verificationId, setVerificationId] = useState('');
const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
```

**Step 1: Send OTP**
```typescript
const handlePhoneSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const result = await messageCenterOTPService.sendOTP(phoneNumber);
  
  if (result.success) {
    // Extract and store verification ID
    setVerificationId(result.data?.verificationId || '');
    setStep('otp');
  } else {
    setError(result.message);
  }
};
```

**Step 2: Verify OTP**
```typescript
const handleOTPSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Pass verification ID to verify function
  const result = await messageCenterOTPService.verifyOTP(
    phoneNumber,
    otp,
    verificationId
  );
  
  if (result.success && result.valid) {
    setStep('success');
    // Redirect after delay
  } else {
    setError(result.message);
  }
};
```

**Step 3: Resend OTP**
```typescript
const handleResendOTP = async () => {
  const result = await messageCenterOTPService.resendOTP(phoneNumber);
  
  if (result.success) {
    // Update verification ID with new one
    setVerificationId(result.data?.verificationId || verificationId);
    setOtp('');
    // Reset timer
  } else {
    setError(result.message);
  }
};
```

---

## 🔐 Wix Secrets Manager Configuration

### Required Secrets

Add these three secrets to your Wix project:

**Secret 1:**
- Name: `MC_CUSTOMER_ID`
- Value: [Your Message Central Customer ID]

**Secret 2:**
- Name: `MC_PASSWORD`
- Value: [Your Message Central Password]

**Secret 3:**
- Name: `MC_EMAIL`
- Value: [Your Message Central Email]

### How to Add Secrets

1. Go to Wix Dashboard
2. Navigate to Develop → Secrets Manager
3. Click "Add Secret"
4. Enter secret name and value
5. Click "Save"
6. Repeat for all three secrets

### Credential Retrieval

Backend automatically:
- Fetches credentials from Wix Secrets Manager
- Caches credentials for 1 hour
- Refreshes cache on expiry
- Never exposes credentials in client code

---

## 📊 Message Central API Endpoints

### Base URL
```
https://api.messagingcenter.com/v1
```

### Endpoints Used

**Send OTP:**
```
POST /otp/send
```

**Verify OTP:**
```
POST /otp/verify
```

**Resend OTP:**
```
POST /otp/resend
```

**Clear OTP (Testing):**
```
POST /otp/clear
```

**Get OTP Status (Testing):**
```
POST /otp/status
```

### Authentication

All requests include:
```javascript
{
  customerId: "...",
  password: "...",
  email: "...",
  // ... other parameters
}
```

---

## 🧪 Testing the Integration

### Test 1: Send OTP
```bash
curl -X POST http://localhost:3000/_functions/sendOTP \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully to +919876543210",
  "phoneNumber": "+919876543210",
  "data": {
    "verificationId": "vid_..."
  }
}
```

### Test 2: Verify OTP
```bash
curl -X POST http://localhost:3000/_functions/verifyOTP \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919876543210",
    "code": "123456",
    "verificationId": "vid_..."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "valid": true,
  "message": "Phone number verified successfully",
  "phoneNumber": "+919876543210",
  "verifiedAt": "2024-01-02T17:53:22.463Z"
}
```

### Test 3: Resend OTP
```bash
curl -X POST http://localhost:3000/_functions/resendOTP \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+919876543210"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully to +919876543210",
  "phoneNumber": "+919876543210",
  "data": {
    "verificationId": "vid_..." // NEW ID
  }
}
```

---

## 📋 Error Handling

### Frontend Error Handling
```typescript
const result = await messageCenterOTPService.sendOTP(phoneNumber);

if (!result.success) {
  // Handle error
  switch (result.code) {
    case 'INVALID_PHONE':
      setError('Please enter a valid phone number');
      break;
    case 'INVALID_FORMAT':
      setError('Phone number must include country code (e.g., +91)');
      break;
    case 'MC_SEND_ERROR':
      setError('Failed to send OTP. Please try again.');
      break;
    default:
      setError(result.message);
  }
}
```

### Backend Error Handling
```javascript
try {
  const result = await callMessageCentralAPI('/otp/send', params);
  
  if (!result.success) {
    return {
      success: false,
      message: result.message || 'Failed to send OTP',
      code: result.code || 'MC_SEND_ERROR',
      data: {}
    };
  }
  
  // Process successful response
} catch (error) {
  console.error('Error sending OTP:', error);
  return {
    success: false,
    message: error.message || 'Failed to send OTP',
    code: 'SEND_ERROR',
    data: {}
  };
}
```

---

## 🔄 Verification ID Lifecycle

```
1. SEND OTP
   ├─ Frontend: POST /sendOTP
   ├─ Backend: Call MC /otp/send
   ├─ MC: Generate OTP + verificationId
   ├─ Backend: Return verificationId
   └─ Frontend: Store verificationId in state

2. VERIFY OTP
   ├─ Frontend: POST /verifyOTP with verificationId
   ├─ Backend: Call MC /otp/verify with verificationId
   ├─ MC: Validate OTP + verificationId match
   ├─ MC: Return success/failure
   ├─ Backend: Update CRM if successful
   └─ Frontend: Redirect if successful

3. RESEND OTP
   ├─ Frontend: POST /resendOTP
   ├─ Backend: Call MC /otp/resend
   ├─ MC: Generate NEW OTP + NEW verificationId
   ├─ Backend: Return NEW verificationId
   └─ Frontend: Update stored verificationId with NEW ID
```

---

## ✅ Verification Checklist

- [ ] MC_CUSTOMER_ID added to Wix Secrets Manager
- [ ] MC_PASSWORD added to Wix Secrets Manager
- [ ] MC_EMAIL added to Wix Secrets Manager
- [ ] Backend messageCentral.jsw deployed
- [ ] HTTP endpoint verifyOTP.js updated
- [ ] Frontend service accepts verificationId parameter
- [ ] Frontend component stores and passes verificationId
- [ ] Send OTP returns verification ID
- [ ] Verify OTP accepts verification ID
- [ ] Resend OTP returns new verification ID
- [ ] CRM contacts created/updated on verification
- [ ] Error handling works for all error codes
- [ ] Phone number formatting works for all formats
- [ ] Credential caching reduces API calls

---

## 📞 Troubleshooting

### "Message Central credentials not found"
- Verify secrets are added to Wix Secrets Manager
- Check secret names match exactly: MC_CUSTOMER_ID, MC_PASSWORD, MC_EMAIL
- Ensure secrets are published (not in draft)

### "Message Central API error"
- Verify MC credentials are correct
- Check MC API endpoint is accessible
- Verify phone number is in E.164 format
- Check MC account has OTP service enabled

### "Missing verification ID"
- Ensure MC API is returning verificationId in response
- Check MC API response structure
- Verify MC API version compatibility

### "Verification ID mismatch"
- Ensure frontend is passing correct verification ID
- Check verification ID wasn't changed between send and verify
- Verify new verification ID is used after resend

---

## 🎓 Key Concepts

### Verification ID
- Unique identifier for each OTP request
- Generated by Message Central
- Must be passed to verify endpoint
- Prevents OTP reuse across sessions
- New ID generated on resend

### Phone Number Formatting
- Accepts any format (10-digit, with country code, etc.)
- Automatically formatted to E.164 format
- E.164 format: +[country code][number]
- Example: +919876543210

### CRM Integration
- Contact created on first verification
- Contact updated on subsequent verifications
- Phone verification status stored
- Verification timestamp recorded
- Graceful error handling if CRM update fails

### Credential Caching
- Credentials cached for 1 hour
- Reduces Wix Secrets Manager API calls
- Automatic refresh on cache expiry
- Improves performance

---

**API Contract Version:** 1.0  
**Last Updated:** 2024-01-02  
**Status:** ✅ Production Ready
