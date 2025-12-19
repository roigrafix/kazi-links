
/**
 * Twilio SMS OTP Service
 * Handles SMS OTP verification for user authentication
 * 
 * IMPORTANT: Store your Twilio credentials securely:
 * - Production: Use Wix Secrets API (see WIX_SECRETS_API_SETUP.md)
 * - Local Development: Create .env.local file with:
 *   VITE_TWILIO_ACCOUNT_SID=your_account_sid
 *   VITE_TWILIO_AUTH_TOKEN=your_auth_token
 *   VITE_TWILIO_SERVICE_SID=VAd3e1619e0cc8a1296109fb6927e00af2
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
    // Try to get from secrets first, fallback to env vars
    this.accountSid = secretsService.getCredential('twilioAccountSid') || 
                      import.meta.env.VITE_TWILIO_ACCOUNT_SID || '';
    this.authToken = secretsService.getCredential('twilioAuthToken') || 
                     import.meta.env.VITE_TWILIO_AUTH_TOKEN || '';
    this.serviceSid = secretsService.getCredential('twilioServiceSid') || 
                      import.meta.env.VITE_TWILIO_SERVICE_SID || '';
    
    if (!this.accountSid || !this.authToken) {
      console.warn(
        'Twilio credentials not configured. SMS OTP functionality will be disabled. ' +
        'Configure credentials via Wix Secrets API or add VITE_TWILIO_ACCOUNT_SID and VITE_TWILIO_AUTH_TOKEN to .env.local'
      );
    }
  }

  /**
   * Send OTP to phone number
   * @param phoneNumber - Phone number in E.164 format (e.g., +1234567890)
   * @returns Promise with verification SID
   */
  async sendOTP(phoneNumber: string): Promise<OTPVerificationResponse> {
    if (!this.accountSid || !this.authToken) {
      return {
        success: false,
        message: 'Twilio credentials not configured. SMS OTP is disabled.',
      };
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      return {
        success: false,
        message: 'Phone number must be in E.164 format (e.g., +1234567890)',
      };
    }

    try {
      const credentials = btoa(`${this.accountSid}:${this.authToken}`);
      
      const response = await fetch(
        `${this.baseUrl}/Services/${this.serviceSid}/Verifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phoneNumber,
            Channel: 'sms',
          }).toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Twilio API error:', error);
        return {
          success: false,
          message: error.message || 'Failed to send OTP. Please try again.',
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: `OTP sent to ${phoneNumber}`,
        sid: data.sid,
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP. Please check your phone number and try again.',
      };
    }
  }

  /**
   * Verify OTP code
   * @param phoneNumber - Phone number in E.164 format
   * @param code - OTP code (6 digits)
   * @returns Promise with verification result
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<OTPCheckResponse> {
    if (!this.accountSid || !this.authToken) {
      return {
        success: false,
        message: 'Twilio credentials not configured. SMS OTP is disabled.',
        valid: false,
      };
    }

    // Validate inputs
    if (!phoneNumber.startsWith('+')) {
      return {
        success: false,
        message: 'Phone number must be in E.164 format (e.g., +1234567890)',
        valid: false,
      };
    }

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return {
        success: false,
        message: 'OTP must be a 6-digit code',
        valid: false,
      };
    }

    try {
      const credentials = btoa(`${this.accountSid}:${this.authToken}`);
      
      const response = await fetch(
        `${this.baseUrl}/Services/${this.serviceSid}/VerificationCheck`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: phoneNumber,
            Code: code,
          }).toString(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Twilio verification error:', error);
        return {
          success: false,
          message: error.message || 'Invalid OTP. Please try again.',
          valid: false,
        };
      }

      const data = await response.json();
      const isValid = data.status === 'approved';

      return {
        success: true,
        message: isValid ? 'OTP verified successfully' : 'Invalid OTP',
        valid: isValid,
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again.',
        valid: false,
      };
    }
  }

  /**
   * Check if Twilio is properly configured
   */
  isConfigured(): boolean {
    return !!this.accountSid && !!this.authToken;
  }

  /**
   * Format phone number to E.164 format
   * Assumes Indian phone numbers if no country code provided
   * @param phoneNumber - Phone number (with or without country code)
   * @returns Formatted phone number in E.164 format
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If already has country code (starts with 91 for India or other), add +
    if (cleaned.length >= 10) {
      if (cleaned.length === 10) {
        // Indian number without country code
        return `+91${cleaned}`;
      } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
        // Indian number with country code but no +
        return `+${cleaned}`;
      } else if (cleaned.startsWith('1') && cleaned.length === 11) {
        // US number without country code
        return `+${cleaned}`;
      }
      // Already formatted or other country
      return `+${cleaned}`;
    }

    return phoneNumber;
  }
}

// Export singleton instance
export const twilioService = new TwilioService();
