# 🔒 Security Implementation Guide - KaziLinks Platform

**Last Updated:** January 12, 2026  
**Status:** Implementation in Progress  
**Target Completion:** January 19, 2026

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Critical Vulnerabilities - Fixes](#critical-vulnerabilities---fixes)
3. [Implementation Checklist](#implementation-checklist)
4. [Code Examples](#code-examples)
5. [Testing & Validation](#testing--validation)
6. [Deployment Guidelines](#deployment-guidelines)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Quick Start

### For Developers
1. Review the [Critical Vulnerabilities](#critical-vulnerabilities---fixes) section
2. Follow the [Implementation Checklist](#implementation-checklist)
3. Use the [Code Examples](#code-examples) to update your components
4. Test using the [Testing & Validation](#testing--validation) guide

### For DevOps/Infrastructure
1. Set up Wix Secrets for API keys (see [Backend Setup](#backend-setup))
2. Configure HTTPS and security headers (see [Server Configuration](#server-configuration))
3. Implement rate limiting (see [Rate Limiting](#rate-limiting))
4. Set up monitoring (see [Monitoring & Maintenance](#monitoring--maintenance))

---

## Critical Vulnerabilities - Fixes

### 1. API Key Exposure (CRITICAL - CVSS 9.8)

**Problem:** SendGrid API key exposed in client-side code

**Solution:** Use secure backend HTTP function

#### Before (❌ VULNERABLE):
```typescript
// sendgridService.ts - CLIENT SIDE
this.apiKey = import.meta.env.VITE_SENDGRID_API_KEY || '';
```

#### After (✅ SECURE):
```typescript
// secureEmailService.ts - CLIENT SIDE
async sendEmail(options: EmailOptions): Promise<boolean> {
  const response = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(options)
  });
  return response.ok;
}

// backend/http-functions/sendEmail.js - BACKEND
export async function sendEmail(options) {
  const apiKey = await getSecretValue('sendgrid_api_key'); // Secure!
  // Send email using apiKey
}
```

**Implementation Steps:**
- [ ] Create backend HTTP function: `/src/backend/http-functions/sendEmail.js` ✅ DONE
- [ ] Create secure email service: `/src/services/secureEmailService.ts` ✅ DONE
- [ ] Update all email sending code to use `secureEmailService`
- [ ] Remove `VITE_SENDGRID_API_KEY` from environment
- [ ] Store API key in Wix Secrets Manager
- [ ] Test email sending via backend

**Wix Secrets Setup:**
```bash
# In Wix Dashboard:
1. Go to Settings > Secrets Manager
2. Create new secret: "sendgrid_api_key"
3. Paste your SendGrid API key
4. Save and deploy
```

---

### 2. Sensitive Data in SessionStorage (CRITICAL - CVSS 9.5)

**Problem:** Booking data with PII stored unencrypted in sessionStorage

**Solution:** Use secure backend session management with HTTP-only cookies

#### Before (❌ VULNERABLE):
```typescript
// BookingPage.tsx
sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
sessionStorage.setItem('bookingReferenceId', referenceId);
```

#### After (✅ SECURE):
```typescript
// BookingPage.tsx
const response = await fetch('/api/create-booking-session', {
  method: 'POST',
  credentials: 'include', // Include HTTP-only cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
});

// backend/http-functions/createBookingSession.js
export async function createBookingSession(options) {
  // Validate and store in secure session
  // Return session ID only (no sensitive data)
  return { sessionId: 'secure-session-id' };
}
```

**Implementation Steps:**
- [ ] Create backend session function: `createBookingSession.js`
- [ ] Update BookingPage.tsx to use backend session
- [ ] Remove all sessionStorage usage for sensitive data
- [ ] Implement session expiration (5-10 minutes)
- [ ] Add session validation on confirmation page
- [ ] Test booking flow end-to-end

**Session Management Best Practices:**
```typescript
// ✅ DO: Use HTTP-only cookies for sessions
fetch('/api/booking', {
  credentials: 'include', // Send cookies
  headers: { 'Content-Type': 'application/json' }
});

// ❌ DON'T: Store sensitive data in sessionStorage
sessionStorage.setItem('bookingData', JSON.stringify(data));

// ❌ DON'T: Store sensitive data in localStorage
localStorage.setItem('phoneNumber', phoneNumber);
```

---

### 3. Missing CSRF Protection (CRITICAL - CVSS 9.2)

**Problem:** No CSRF tokens on state-changing requests

**Solution:** Implement CSRF token validation on all POST/PUT/DELETE requests

#### Before (❌ VULNERABLE):
```typescript
// BookingPage.tsx
await BaseCrudService.create('bookings', bookingData);
```

#### After (✅ SECURE):
```typescript
// BookingPage.tsx
import { secureFetch } from '@/lib/csrf-protection';

const response = await secureFetch('/api/bookings', {
  method: 'POST',
  body: JSON.stringify(bookingData)
});

// Layout.tsx - Inject CSRF token in HTML
<meta name="csrf-token" content={csrfToken} />
```

**Implementation Steps:**
- [ ] Add CSRF token to HTML meta tag in Layout.tsx
- [ ] Update all API calls to use `secureFetch()` from `/src/lib/csrf-protection.ts` ✅ DONE
- [ ] Implement CSRF validation middleware on backend
- [ ] Set SameSite=Strict on cookies
- [ ] Test CSRF protection with security tools

**CSRF Protection Usage:**
```typescript
// Import the secure fetch function
import { secureFetch, getCsrfToken } from '@/lib/csrf-protection';

// Use it for all state-changing requests
const response = await secureFetch('/api/bookings', {
  method: 'POST',
  body: JSON.stringify(data)
});

// Or manually add token to headers
const headers = {
  'X-CSRF-Token': getCsrfToken(),
  'Content-Type': 'application/json'
};
```

---

### 4. Unencrypted Phone Number Storage (CRITICAL - CVSS 9.1)

**Problem:** Phone numbers stored in plain text in localStorage

**Solution:** Use encrypted backend storage with AES-256

#### Before (❌ VULNERABLE):
```typescript
// phoneVerificationService.ts
localStorage.setItem('phoneVerification', JSON.stringify({
  phoneNumber: verifiedPhone, // Plain text!
  verified: true
}));
```

#### After (✅ SECURE):
```typescript
// phoneVerificationService.ts
const response = await fetch('/api/verify-phone', {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({ phoneNumber })
});

// backend/http-functions/storePhoneVerification.js
export async function storePhoneVerification(options) {
  const encryptedPhone = encryptPhoneNumber(options.phoneNumber);
  // Store encrypted phone in Wix CRM
  await contacts.updateContact(contactId, {
    custom: { encrypted_phone: encryptedPhone }
  });
}
```

**Implementation Steps:**
- [ ] Create backend phone verification function: `storePhoneVerification.js` ✅ DONE
- [ ] Update phoneVerificationService.ts to use backend API
- [ ] Remove all localStorage usage for phone numbers
- [ ] Implement encryption key rotation policy
- [ ] Add access logging for phone number retrieval
- [ ] Test phone verification flow

**Encryption Best Practices:**
```typescript
// ✅ DO: Encrypt sensitive data before storage
const encryptedPhone = encryptPhoneNumber(phoneNumber);
await storeInDatabase(encryptedPhone);

// ❌ DON'T: Store plain text sensitive data
localStorage.setItem('phone', phoneNumber);
sessionStorage.setItem('phone', phoneNumber);
```

---

### 5. Insufficient Input Validation (CRITICAL - CVSS 8.9)

**Problem:** Minimal validation of user inputs

**Solution:** Comprehensive input validation on client and server

#### Before (❌ VULNERABLE):
```typescript
// BookingPage.tsx
if (!selectedService || !selectedFreelancer || !formData.bookingDate) {
  alert('Please complete all required fields.');
  return;
}
// No email validation, no phone validation, no sanitization
```

#### After (✅ SECURE):
```typescript
// BookingPage.tsx
import { validateBookingForm, isAllValid, getValidationErrors } from '@/lib/input-validation';

const validationResults = validateBookingForm(formData);
if (!isAllValid(validationResults)) {
  const errors = getValidationErrors(validationResults);
  setError(errors.join('\n'));
  return;
}

// Use validated data
const sanitizedData = {
  clientName: validationResults.clientName.sanitized,
  clientEmail: validationResults.clientEmail.sanitized,
  clientPhone: validationResults.clientPhone.sanitized,
  // ... other fields
};
```

**Implementation Steps:**
- [ ] Import validation utilities: `/src/lib/input-validation.ts` ✅ DONE
- [ ] Add validation to BookingPage.tsx
- [ ] Add validation to all form components
- [ ] Implement server-side validation (CRITICAL!)
- [ ] Add rate limiting on form submissions
- [ ] Test with malicious inputs

**Validation Usage:**
```typescript
import {
  validateEmail,
  validatePhoneNumber,
  validateName,
  validateAddress,
  validateBookingForm,
  isAllValid,
  getValidationErrors
} from '@/lib/input-validation';

// Validate individual fields
const emailResult = validateEmail(email);
if (!emailResult.isValid) {
  console.error(emailResult.error);
}

// Validate entire form
const results = validateBookingForm(formData);
if (isAllValid(results)) {
  // All validations passed
  submitForm(results);
} else {
  const errors = getValidationErrors(results);
  showErrors(errors);
}
```

---

## Implementation Checklist

### Phase 1: CRITICAL (Immediate - 24 hours)

#### API Key Exposure
- [ ] Create `/src/backend/http-functions/sendEmail.js` ✅ DONE
- [ ] Create `/src/services/secureEmailService.ts` ✅ DONE
- [ ] Update BookingConfirmationPage.tsx to use secureEmailService
- [ ] Update all email sending code
- [ ] Store SendGrid key in Wix Secrets
- [ ] Remove VITE_SENDGRID_API_KEY from environment
- [ ] Test email sending

#### SessionStorage Data Exposure
- [ ] Create backend session management function
- [ ] Update BookingPage.tsx to use backend sessions
- [ ] Update BookingConfirmationPage.tsx
- [ ] Remove sessionStorage usage
- [ ] Implement session expiration
- [ ] Test booking flow

#### CSRF Protection
- [ ] Create `/src/lib/csrf-protection.ts` ✅ DONE
- [ ] Add CSRF token to Layout.tsx
- [ ] Update all API calls to use secureFetch()
- [ ] Implement backend CSRF validation
- [ ] Set SameSite=Strict on cookies
- [ ] Test CSRF protection

#### Phone Number Encryption
- [ ] Create `/src/backend/http-functions/storePhoneVerification.js` ✅ DONE
- [ ] Update phoneVerificationService.ts
- [ ] Remove localStorage usage
- [ ] Test phone verification

#### Input Validation
- [ ] Create `/src/lib/input-validation.ts` ✅ DONE
- [ ] Add validation to BookingPage.tsx
- [ ] Add validation to all forms
- [ ] Implement server-side validation
- [ ] Test with malicious inputs

### Phase 2: HIGH (48-72 hours)

- [ ] Remove console logging from production code
- [ ] Add authentication verification on protected routes
- [ ] Implement rate limiting
- [ ] Add security headers
- [ ] Enforce HTTPS
- [ ] Add error tracking service

### Phase 3: ENHANCEMENT (1-2 weeks)

- [ ] Implement comprehensive data encryption
- [ ] Add error tracking (Sentry)
- [ ] Implement security monitoring
- [ ] Conduct penetration testing
- [ ] Security training for team

---

## Code Examples

### Example 1: Updating BookingPage.tsx with Input Validation

```typescript
import { validateBookingForm, isAllValid, getValidationErrors } from '@/lib/input-validation';
import { secureFetch } from '@/lib/csrf-protection';

export default function BookingPage() {
  // ... existing code ...

  const handleSubmit = async () => {
    // Validate input
    const validationResults = validateBookingForm(formData);
    if (!isAllValid(validationResults)) {
      const errors = getValidationErrors(validationResults);
      setError(errors.join('\n'));
      return;
    }

    // Use validated data
    const sanitizedData = {
      clientName: validationResults.clientName.sanitized,
      clientEmail: validationResults.clientEmail.sanitized,
      clientPhone: validationResults.clientPhone.sanitized,
      // ... other validated fields
    };

    // Send to backend with CSRF protection
    const response = await secureFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(sanitizedData)
    });

    if (!response.ok) {
      setError('Failed to create booking');
      return;
    }

    // Success handling
    navigate('/booking-confirmation');
  };

  // ... rest of component ...
}
```

### Example 2: Secure Email Sending

```typescript
import { secureEmailService } from '@/services/secureEmailService';

// Send booking confirmation
const emailSent = await secureEmailService.sendBookingConfirmation({
  clientName: booking.clientName,
  clientEmail: booking.clientEmail,
  serviceName: booking.serviceName,
  freelancerName: booking.freelancerName,
  bookingDate: formattedDate,
  bookingTime: booking.bookingTime,
  serviceAddress: booking.serviceAddress,
  paymentAmount: booking.paymentAmount,
  bookingId: booking._id
});

if (!emailSent) {
  console.warn('Failed to send email, but booking was created');
}
```

### Example 3: CSRF Protection in Forms

```typescript
import { secureFetch } from '@/lib/csrf-protection';

async function submitForm(formData) {
  try {
    const response = await secureFetch('/api/submit-form', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Form submission failed');
    }

    const result = await response.json();
    console.log('Form submitted successfully');
  } catch (error) {
    console.error('Error submitting form:', error);
  }
}
```

### Example 4: Backend CSRF Validation

```typescript
// backend/middleware/csrfProtection.js
export function csrfProtectionMiddleware(req, res, next) {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'];
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token validation failed'
    });
  }

  next();
}
```

---

## Testing & Validation

### Security Testing Checklist

#### 1. Input Validation Testing
```typescript
// Test cases for email validation
const testCases = [
  { email: 'valid@example.com', expected: true },
  { email: 'invalid.email', expected: false },
  { email: 'test@', expected: false },
  { email: '<script>alert("xss")</script>@test.com', expected: false },
];

testCases.forEach(({ email, expected }) => {
  const result = validateEmail(email);
  console.assert(result.isValid === expected, `Email validation failed for: ${email}`);
});
```

#### 2. CSRF Protection Testing
```bash
# Test CSRF protection
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  # Should fail without CSRF token

curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: valid-token" \
  -d '{"test": "data"}' \
  # Should succeed with valid CSRF token
```

#### 3. API Key Exposure Testing
```bash
# Check if API key is exposed in client bundle
grep -r "SENDGRID_API_KEY" dist/
# Should return nothing

# Check network requests
# Open DevTools > Network tab
# Make email request
# Should NOT see API key in request headers
```

#### 4. SessionStorage Testing
```typescript
// Verify no sensitive data in sessionStorage
console.log(sessionStorage);
// Should NOT contain: bookingData, phoneNumber, paymentInfo

// Verify secure session usage
const sessionId = sessionStorage.getItem('sessionId');
// Should only contain: sessionId (no sensitive data)
```

### Manual Testing Steps

1. **Test Booking Flow**
   - [ ] Fill booking form with valid data
   - [ ] Verify input validation works
   - [ ] Submit booking
   - [ ] Verify no sensitive data in sessionStorage
   - [ ] Verify email sent via backend

2. **Test CSRF Protection**
   - [ ] Open DevTools > Network
   - [ ] Submit form
   - [ ] Verify X-CSRF-Token header is present
   - [ ] Try request without token (should fail)

3. **Test Phone Verification**
   - [ ] Enter phone number
   - [ ] Verify no plain text in localStorage
   - [ ] Verify encrypted storage on backend

4. **Test Input Validation**
   - [ ] Try invalid email (should show error)
   - [ ] Try invalid phone (should show error)
   - [ ] Try XSS payload (should be sanitized)
   - [ ] Try SQL injection (should be rejected)

---

## Deployment Guidelines

### Pre-Deployment Checklist

- [ ] All critical vulnerabilities fixed
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] API keys in Wix Secrets
- [ ] Rate limiting configured
- [ ] Monitoring set up

### Deployment Steps

1. **Backup Current Deployment**
   ```bash
   # Create backup of current version
   git tag -a v1.0.0-backup -m "Backup before security update"
   git push origin v1.0.0-backup
   ```

2. **Deploy Security Updates**
   ```bash
   # Deploy to staging first
   npm run build
   npm run deploy:staging
   
   # Run security tests
   npm run test:security
   
   # Deploy to production
   npm run deploy:production
   ```

3. **Verify Deployment**
   - [ ] All endpoints responding
   - [ ] Email sending working
   - [ ] CSRF protection active
   - [ ] Input validation working
   - [ ] No errors in logs

4. **Monitor for Issues**
   - [ ] Check error logs
   - [ ] Monitor API response times
   - [ ] Track user reports
   - [ ] Review security alerts

---

## Monitoring & Maintenance

### Security Monitoring

#### 1. Log Monitoring
```typescript
// Monitor for suspicious activity
- Failed CSRF token validations
- Invalid input attempts
- Failed authentication attempts
- Unauthorized API access
```

#### 2. Performance Monitoring
```typescript
// Monitor for performance issues
- Email sending latency
- API response times
- Database query times
- Session management overhead
```

#### 3. Error Tracking
```typescript
// Use error tracking service (Sentry)
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

### Regular Maintenance Tasks

#### Weekly
- [ ] Review security logs
- [ ] Check for failed validations
- [ ] Monitor error rates
- [ ] Review API usage

#### Monthly
- [ ] Security audit
- [ ] Dependency updates
- [ ] API key rotation
- [ ] Backup verification

#### Quarterly
- [ ] Penetration testing
- [ ] Security training
- [ ] Compliance review
- [ ] Disaster recovery drill

---

## Troubleshooting

### Common Issues

#### Issue: CSRF Token Validation Failing
**Solution:**
```typescript
// Ensure token is in meta tag
<meta name="csrf-token" content={csrfToken} />

// Ensure secureFetch is used
import { secureFetch } from '@/lib/csrf-protection';
const response = await secureFetch('/api/endpoint', { method: 'POST' });
```

#### Issue: Email Not Sending
**Solution:**
```typescript
// Check Wix Secrets configuration
// Verify sendgrid_api_key is set in Wix Secrets Manager
// Check backend logs for errors
// Verify email address is valid
```

#### Issue: Input Validation Not Working
**Solution:**
```typescript
// Import validation utilities
import { validateBookingForm, isAllValid } from '@/lib/input-validation';

// Use validation before submission
const results = validateBookingForm(formData);
if (!isAllValid(results)) {
  // Show errors
}
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Wix Security Best Practices](https://www.wix.com/en/security)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

---

## Support & Questions

For questions or issues with security implementation:

1. **Check this guide** - Most common issues are covered in Troubleshooting
2. **Review code examples** - See Code Examples section for implementation patterns
3. **Contact security team** - security@kazilinks.com
4. **Create GitHub issue** - For bugs or feature requests

---

**Last Updated:** January 12, 2026  
**Next Review:** January 26, 2026  
**Maintained By:** Security Team

