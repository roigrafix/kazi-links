/**
 * Twilio SMS OTP Service (Refactored)
 */

import { secretsService } from './secretsService';

interface OTPVerificationResponse {
  success: boolean;
  message: string;
  sid?: string;
}

interface OTPCheckResponse {
  success: boolean;
  message: string;
  valid: boolean;
}

class TwilioService {
  private accountSid: string;
  private authToken: string;
  private serviceSid: string;
  private baseUrl = 'https://verify.twilio.com/v2';

  constructor() {
    this.accountSid = secretsService.getCredential('twilioAccountSid') || 
                      import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    this.authToken = secretsService.getCredential('twilioAuthToken') || 
                     import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    this.serviceSid = secretsService.getCredential('twilioServiceSid') || 
                      import.meta.env.VITE_TWILIO_SERVICE_SID || '';
    
    if (!this.accountSid || !this.authToken || !this.serviceSid) {
      console.warn('Twilio Service: Missing credentials or Service SID.');
    }
  }

  private getAuthHeader(): string {
    const raw = `${this.accountSid}:${this.authToken}`;
    // Cross-environment base64 encoding
    return typeof Buffer !== 'undefined' 
      ? `Basic ${Buffer.from(raw).toString('base64')}`
      : `Basic ${btoa(raw)}`;
  }

  /**
   * Send OTP to phone number
   */
  async sendOTP(phoneNumber: string): Promise<OTPVerificationResponse> {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);

    if (!this.isConfigured()) {
      return { success: false, message: 'Twilio configuration missing.' };
    }

    if (!formattedNumber.startsWith('+')) {
      return { success: false, message: 'Invalid phone format. Please include country code.' };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Services/${this.serviceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedNumber,
            Channel: 'sms',
          }).toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Failed to send OTP.' 
        };
      }

      return {
        success: true,
        message: `OTP sent to ${formattedNumber}`,
        sid: data.sid,
      };
    } catch (error) {
      console.error('Twilio Send Error:', error);
      return { success: false, message: 'Network error while sending OTP.' };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<OTPCheckResponse> {
    const formattedNumber = this.formatPhoneNumber(phoneNumber);
    const cleanCode = code.trim();

    if (!this.isConfigured()) {
      return { success: false, message: 'Twilio configuration missing.', valid: false };
    }

    if (cleanCode.length < 4 || cleanCode.length > 10) {
      return { success: false, message: 'Invalid code length.', valid: false };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/Services/${this.serviceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedNumber,
            Code: cleanCode,
          }).toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { 
          success: false, 
          message: data.message || 'Verification failed.', 
          valid: false 
        };
      }

      return {
        success: true,
        message: data.status === 'approved' ? 'Verified' : 'Invalid code',
        valid: data.status === 'approved',
      };
    } catch (error) {
      console.error('Twilio Verify Error:', error);
      return { success: false, message: 'Network error during verification.', valid: false };
    }
  }

  isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.serviceSid);
  }

  formatPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Remove all non-digits
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Example logic for India/US (Customize as needed)
    if (cleaned.length === 10) {
      return `+91${cleaned}`; // Default to India
    } else if (cleaned.length > 10 && !phoneNumber.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return phoneNumber.startsWith('+') ? phoneNumber : `+${cleaned}`;
  }
}

export const twilioService = new TwilioService();
