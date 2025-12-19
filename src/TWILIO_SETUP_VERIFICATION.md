# Twilio OTP Setup - Complete Verification Guide

## 🔍 Current Status Check

Your Twilio integration is **properly implemented** in the code. The "Send OTP" button is unresponsive because **environment variables are not configured**.

---

## ✅ What's Working in Your Code

### 1. **BookingPage.tsx** ✓
- Lines 113-160: `sendOtp()` function properly calls `twilioService.sendOTP()`
- Lines 163-200: `verifyOtp()` function properly calls `twilioService.verifyOTP()`
- Proper error handling and user feedback
- Phone number validation (10-digit Indian format)

### 2. **twilioService.ts** ✓
- Lines 31-34: Reads environment variables correctly
- Lines 36-41: Logs warning if credentials missing
- Lines 49-105: `sendOTP()` method with proper Twilio API integration
- Lines 113-183: `verifyOTP()` method with proper verification
- Lines 198-219: `formatPhoneNumber()` helper for E.164 format conversion

### 3. **SMSAuthPage.tsx** ✓
- Alternative SMS authentication page
- Also uses `twilioService` correctly

---

## ❌ What's Missing: Environment Variables

Your `.env.local` file **does not exist** or is **not configured**.

### Current State:
```
❌ No .env.local file found in project root
❌ VITE_TWILIO_ACCOUNT_SID = undefined
❌ VITE_TWILIO_AUTH_TOKEN = undefined
❌ VITE_TWILIO_SERVICE_SID = undefined (fallback: VAd3e1619e0cc8a1296109fb6927e00af2)
```

### Result:
When you click "Send OTP":
1. `twilioService.isConfigured()` returns `false` (line 129 in BookingPage.tsx)
2. Error is set: "SMS service is not configured. Please contact support."
3. Function returns early without attempting to send OTP
4. Button appears unresponsive because no visible error message is shown

---

## 🚀 Step-by-Step Fix

### Step 1: Create `.env.local` File

**Location**: Project root (same level as `package.json`)

**File Path**: `/.env.local`

**Content**:
```env
# Twilio Configuration (for SMS OTP)
VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_SERVICE_SID=VAd3e1619e0cc8a1296109fb6927e00af2
```

### Step 2: Get Your Twilio Credentials

#### 2a. Create Twilio Account (if you don't have one)
1. Go to [twilio.com](https://www.twilio.com)
2. Sign up for a free account
3. Verify your email and phone number

#### 2b. Get Account SID and Auth Token
1. Log in to [Twilio Console](https://www.twilio.com/console)
2. On the dashboard, you'll see:
   - **Account SID** (starts with `AC`)
   - **Auth Token** (long string)
3. Copy these values to `.env.local`

#### 2c. Create or Get Verify Service SID
1. In Twilio Console, go to **Verify** (left sidebar)
2. Click **Services**
3. Either:
   - **Create a new service**: Click "Create Service", name it (e.g., "KaziLinks OTP"), copy the **Service SID** (starts with `VA`)
   - **Use existing service**: Copy the Service SID from your existing service
4. Add this to `.env.local` as `VITE_TWILIO_SERVICE_SID`

### Step 3: Update `.env.local` with Real Credentials

Replace the placeholder values:

```env
# Example with real values:
VITE_TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcdef
VITE_TWILIO_AUTH_TOKEN=abcdef1234567890abcdef1234567890
VITE_TWILIO_SERVICE_SID=VA1234567890abcdef1234567890abcdef
```

### Step 4: Restart Development Server

**CRITICAL**: Vite only reads environment variables on startup.

```bash
# Stop your dev server (Ctrl+C in terminal)
# Then restart it:
npm run dev
```

### Step 5: Verify Configuration

1. Open your browser's **Developer Console** (F12)
2. Go to **Console** tab
3. Look for these messages:

**Before Fix (credentials missing):**
```
⚠️ Twilio credentials not configured. SMS OTP functionality will be disabled. 
Add VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN to your environment variables.
```

**After Fix (credentials loaded):**
```
✅ No warning message = credentials are loaded correctly
```

### Step 6: Test the OTP Button

1. Navigate to the **Booking Page** (`/booking`)
2. Fill in a phone number (e.g., `9876543210`)
3. Click **"Send OTP"** button
4. Check the console for:
   - `"Sending OTP to formatted phone: +919876543210"`
   - `"OTP sent successfully to: +919876543210"` (success)
   - Or error message if something went wrong

### Step 7: Verify SMS Delivery

1. Check your phone for an SMS with a 6-digit code
2. Enter the code in the OTP verification field
3. Click **"Verify OTP"**

---

## 🔧 Troubleshooting

### Issue 1: "SMS service is not configured" Error

**Cause**: Environment variables not set or dev server not restarted

**Solution**:
```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Verify content
cat .env.local | grep VITE_TWILIO

# 3. Restart dev server
# Stop: Ctrl+C
# Start: npm run dev

# 4. Clear browser cache (Ctrl+Shift+Delete)
# 5. Reload page (Ctrl+R)
```

### Issue 2: "Invalid phone number format" Error

**Cause**: Phone number not in correct format

**Solution**:
- Enter 10-digit Indian number: `9876543210`
- Or with country code: `+919876543210`
- The code automatically converts to E.164 format

### Issue 3: "401 Unauthorized" Error

**Cause**: Invalid Twilio credentials

**Solution**:
1. Verify Account SID starts with `AC`
2. Verify Auth Token is correct (no extra spaces)
3. Check credentials in Twilio Console
4. Update `.env.local` with correct values
5. Restart dev server

### Issue 4: "429 Too Many Requests" Error

**Cause**: Rate limiting - too many OTP requests

**Solution**:
- Wait 5-10 minutes before trying again
- Twilio limits: 5 verification attempts per phone number per 10 minutes

### Issue 5: SMS Not Received

**Cause**: Multiple possible reasons

**Solution**:
1. Check Twilio Console → Verify → Logs
2. Look for your phone number in the logs
3. Check status:
   - **Pending**: OTP sent, awaiting verification
   - **Approved**: OTP verified successfully
   - **Failed**: OTP verification failed
4. Verify phone number is correct
5. Check if phone number is in a supported country

---

## 📋 Verification Checklist

Use this to confirm everything is set up correctly:

- [ ] `.env.local` file created in project root
- [ ] `VITE_TWILIO_ACCOUNT_SID` added (starts with `AC`)
- [ ] `VITE_TWILIO_AUTH_TOKEN` added (no spaces)
- [ ] `VITE_TWILIO_SERVICE_SID` added (starts with `VA`)
- [ ] Development server restarted (`npm run dev`)
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] Page reloaded (Ctrl+R)
- [ ] Console shows no "credentials not configured" warning
- [ ] Phone number entered in correct format (10 digits)
- [ ] "Send OTP" button is clickable
- [ ] OTP sent successfully (check console)
- [ ] SMS received on phone
- [ ] OTP verification successful

---

## 🔐 Security Notes

**IMPORTANT**: Never commit `.env.local` to version control!

```bash
# .env.local should be in .gitignore
echo ".env.local" >> .gitignore
```

Your `.env.local` contains sensitive credentials and should only exist locally.

---

## 📚 Reference Files

- **Implementation**: `/src/services/twilioService.ts`
- **Usage**: `/src/components/pages/BookingPage.tsx` (lines 113-160)
- **Alternative**: `/src/components/pages/SMSAuthPage.tsx`
- **Example**: `/src/.env.example`

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12 → Console tab)
2. **Check network requests** (F12 → Network tab → filter "verify.twilio.com")
3. **Check Twilio Console** → Verify → Logs
4. **Verify credentials** in Twilio Console
5. **Restart dev server** after any changes

---

## ✨ Next Steps

1. Create `.env.local` with Twilio credentials
2. Restart dev server
3. Test OTP sending on booking page
4. Verify SMS delivery
5. Deploy to production with environment variables set

Once configured, the "Send OTP" button will be fully functional! 🎉
