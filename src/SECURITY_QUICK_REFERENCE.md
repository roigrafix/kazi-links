# 🔐 Security Quick Reference Guide

**Quick lookup for common security tasks**

---

## Input Validation

### Validate Email
```typescript
import { validateEmail } from '@/lib/input-validation';

const result = validateEmail(email);
if (!result.valid) {
  console.error(result.error);
}
```

### Validate Phone Number
```typescript
import { validatePhoneNumber } from '@/lib/input-validation';

const result = validatePhoneNumber(phone);
if (!result.valid) {
  console.error(result.error);
}
```

### Validate Booking Form
```typescript
import { validateBookingFormData } from '@/lib/input-validation';

const validation = validateBookingFormData(formData);
if (!validation.valid) {
  // Show errors to user
  Object.entries(validation.errors).forEach(([field, error]) => {
    setFieldError(field, error);
  });
}
```

### Validate Refund Request
```typescript
import { validateRefundRequestData } from '@/lib/input-validation';

const validation = validateRefundRequestData(refundData);
if (!validation.valid) {
  // Handle errors
}
```

---

## CSRF Protection

### Make Protected Request
```typescript
import { fetchWithCSRF } from '@/lib/csrf-protection';

const response = await fetchWithCSRF('/api/bookings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Add CSRF Token to Headers
```typescript
import { addCSRFTokenToRequest } from '@/lib/csrf-protection';

const headers = addCSRFTokenToRequest({
  'Content-Type': 'application/json'
});

const response = await fetch('/api/bookings', {
  method: 'POST',
  headers,
  body: JSON.stringify(data)
});
```

### Get CSRF Token from Meta Tag
```typescript
import { getCSRFTokenFromMeta } from '@/lib/csrf-protection';

const token = getCSRFTokenFromMeta();
// Use token in request headers
```

---

## Secure Email Sending

### Send Booking Confirmation
```typescript
import { sendGridService } from '@/services/sendgridService';

const success = await sendGridService.sendBookingConfirmation({
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  serviceName: 'House Cleaning',
  freelancerName: 'Jane Smith',
  bookingDate: '2025-01-20',
  bookingTime: '10:00',
  serviceAddress: '123 Main St',
  paymentAmount: 500,
  bookingId: 'BOOK-123'
});

if (!success) {
  console.error('Failed to send email');
}
```

### Send Freelancer Notification
```typescript
const success = await sendGridService.sendFreelancerBookingNotification(
  'freelancer@example.com',
  bookingData
);
```

### Send Support Confirmation
```typescript
const success = await sendGridService.sendSupportRequestConfirmation({
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  subject: 'Booking Issue',
  message: 'I need help with my booking',
  supportRequestId: 'SUP-123'
});
```

### Send Review Notification
```typescript
const success = await sendGridService.sendReviewNotification({
  freelancerName: 'Jane Smith',
  freelancerEmail: 'jane@example.com',
  clientName: 'John Doe',
  rating: 5,
  reviewTitle: 'Great Service!',
  reviewContent: 'Very professional and timely',
  serviceName: 'House Cleaning'
});
```

---

## Secure Phone Verification

### Verify Phone Number
```typescript
const response = await fetch('/api/verify-phone', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '9876543210',
    userId: member._id,
    userEmail: member.loginEmail
  })
});

const result = await response.json();
if (result.success) {
  console.log('Phone verified and stored securely');
}
```

### Get Verification Status
```typescript
const response = await fetch(`/api/phone-verification-status?userId=${userId}`, {
  credentials: 'include'
});

const result = await response.json();
console.log('Verified:', result.verified);
```

### Clear Verification Data
```typescript
const response = await fetch('/api/clear-phone-verification', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: member._id })
});
```

---

## Secure Session Management

### Create Booking Session
```typescript
const response = await fetchWithCSRF('/api/create-booking-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bookingData)
});

const { sessionId } = await response.json();
// Redirect with session ID only
window.location.href = `/booking-confirmation?sessionId=${sessionId}`;
```

### Retrieve Session Data
```typescript
const response = await fetch(`/api/get-booking-session?sessionId=${sessionId}`, {
  credentials: 'include'
});

const { bookingData } = await response.json();
// Use booking data
```

---

## Common Validation Patterns

### Validate All Form Fields
```typescript
import { 
  validateName,
  validateEmail,
  validatePhoneNumber,
  validateAddress,
  validatePostalCode,
  validateCity,
  validateState,
  validateBookingDate,
  validateTime,
  validateAmount
} from '@/lib/input-validation';

const errors = {};

const nameVal = validateName(formData.clientName);
if (!nameVal.valid) errors.clientName = nameVal.error;

const emailVal = validateEmail(formData.clientEmail);
if (!emailVal.valid) errors.clientEmail = emailVal.error;

const phoneVal = validatePhoneNumber(formData.clientPhone);
if (!phoneVal.valid) errors.clientPhone = phoneVal.error;

// ... validate other fields

if (Object.keys(errors).length > 0) {
  // Show errors
  return;
}

// Proceed with submission
```

### Sanitize User Input
```typescript
import { sanitizeString } from '@/lib/input-validation';

const cleanName = sanitizeString(userInput);
// Use cleanName safely
```

---

## Backend Function Examples

### Secure Email Function
```javascript
// /src/backend/http-functions/sendEmail.js
import { getSecret } from 'wix-secrets-backend';

export async function sendEmail(request) {
  try {
    // Get API key from secrets
    const apiKey = await getSecret('sendgrid-api-key');
    
    // Validate input
    if (!request.body.to || !request.body.subject) {
      return {
        statusCode: 400,
        body: { success: false, error: 'Missing required fields' }
      };
    }

    // Send email
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: request.body.to }],
          subject: request.body.subject
        }],
        from: { email: 'noreply@servicebooking.com' },
        content: [{
          type: 'text/html',
          value: request.body.html
        }]
      })
    });

    return {
      statusCode: response.ok ? 200 : 500,
      body: { success: response.ok }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: { success: false, error: error.message }
    };
  }
}
```

### CSRF Protected Endpoint
```javascript
// /src/backend/http-functions/createBooking.js
import { csrfProtectionMiddleware } from '@/lib/csrf-protection';
import { validateBookingFormData } from '@/lib/input-validation';

export async function createBooking(request) {
  // Validate CSRF token
  const csrfValidation = csrfProtectionMiddleware()(request);
  if (!csrfValidation.valid) {
    return {
      statusCode: 403,
      body: { success: false, error: 'CSRF validation failed' }
    };
  }

  // Validate input
  const validation = validateBookingFormData(request.body);
  if (!validation.valid) {
    return {
      statusCode: 400,
      body: { success: false, errors: validation.errors }
    };
  }

  // Create booking
  try {
    // ... booking creation logic
    return {
      statusCode: 200,
      body: { success: true, bookingId: 'BOOK-123' }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: { success: false, error: 'Failed to create booking' }
    };
  }
}
```

---

## Security Checklist for New Features

- [ ] All user inputs are validated
- [ ] Validation happens on both client and server
- [ ] CSRF tokens are used on state-changing requests
- [ ] No sensitive data in localStorage/sessionStorage
- [ ] API keys are stored in Wix Secrets
- [ ] Error messages don't expose system info
- [ ] No console.log statements in production code
- [ ] All database queries use parameterized queries
- [ ] Authentication is checked on protected routes
- [ ] Authorization is checked on sensitive operations
- [ ] Sensitive data is encrypted at rest
- [ ] HTTPS is enforced
- [ ] Rate limiting is implemented
- [ ] Logging doesn't include sensitive data
- [ ] Security headers are configured

---

## Common Mistakes to Avoid

❌ **DON'T:**
- Store API keys in client-side code
- Trust client-side validation alone
- Store sensitive data in localStorage/sessionStorage
- Log sensitive information
- Use plain text for passwords/tokens
- Skip CSRF protection
- Hardcode secrets in code
- Use outdated dependencies
- Ignore security warnings
- Skip input validation

✅ **DO:**
- Store secrets in Wix Secrets Manager
- Always validate on the backend
- Use secure backend storage
- Sanitize log output
- Use encryption for sensitive data
- Implement CSRF protection
- Use environment variables for config
- Keep dependencies updated
- Address security warnings
- Validate all inputs

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Wix Security Docs](https://www.wix.com/en/security)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)
- [CVSS Calculator](https://www.first.org/cvss/calculator/3.1)

---

## Getting Help

- **Questions?** Check SECURITY_IMPLEMENTATION_GUIDE.md
- **Issues?** Check SECURITY_AUDIT_REPORT.md
- **Need training?** Contact the security team
- **Found a vulnerability?** Report to security team immediately

---

**Last Updated:** January 12, 2026  
**Version:** 1.0
