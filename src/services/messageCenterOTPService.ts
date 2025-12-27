import { web } from '@/integrations';

interface OTPResponse {
  success: boolean;
  message: string;
  phoneNumber?: string;
  messageId?: string;
  isTestMode?: boolean;
  otp?: string;
  code?: string;
}

interface VerifyResponse {
  success: boolean;
  valid: boolean;
  message: string;
  phoneNumber?: string;
  verifiedAt?: string;
  code?: string;
  attemptsRemaining?: number;
}

class MessageCenterOTPService {
  /**
   * Formats phone number to E.164 format
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      // Indian 10-digit number, add +91
      return `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // Indian number with country code but no +
      return `+${cleaned}`;
    } else if (cleaned.length > 10) {
      // Assume it's a full number with country code
      return `+${cleaned}`;
    }
    
    // Return original if can't parse
    return phoneNumber;
  }

  /**
   * Validates phone number format
   */
  validatePhoneNumber(phoneNumber: string): { valid: boolean; error?: string } {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return { valid: false, error: 'Phone number is required' };
    }

    const formatted = this.formatPhoneNumber(phoneNumber);
    
    if (!/^\+\d{1,15}$/.test(formatted)) {
      return { 
        valid: false, 
        error: 'Phone number must be in valid format (e.g., +91 for India)' 
      };
    }

    return { valid: true };
  }

  /**
   * Sends OTP to phone number via Wix Messaging Center
   */
  async sendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Invalid phone number',
          code: 'INVALID_PHONE'
        };
      }

      // Call backend function
      const result = await web.callFunction('sendOTP', { phoneNumber });

      if (result.ok) {
        return result.item as OTPResponse;
      } else {
        return {
          success: false,
          message: result.error?.message || 'Failed to send OTP',
          code: 'SEND_ERROR'
        };
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
        code: 'SEND_ERROR'
      };
    }
  }

  /**
   * Verifies OTP code
   */
  async verifyOTP(phoneNumber: string, code: string): Promise<VerifyResponse> {
    try {
      if (!phoneNumber || !code) {
        return {
          success: false,
          valid: false,
          message: 'Phone number and OTP code are required',
          code: 'MISSING_PARAMS'
        };
      }

      if (code.length !== 6 || !/^\d+$/.test(code)) {
        return {
          success: false,
          valid: false,
          message: 'OTP must be a 6-digit code',
          code: 'INVALID_FORMAT'
        };
      }

      // Call backend function
      const result = await web.callFunction('verifyOTP', { 
        phoneNumber, 
        code 
      });

      if (result.ok) {
        return result.item as VerifyResponse;
      } else {
        return {
          success: false,
          valid: false,
          message: result.error?.message || 'Failed to verify OTP',
          code: 'VERIFY_ERROR'
        };
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        valid: false,
        message: error.message || 'Failed to verify OTP',
        code: 'VERIFY_ERROR'
      };
    }
  }

  /**
   * Resends OTP to phone number
   */
  async resendOTP(phoneNumber: string): Promise<OTPResponse> {
    try {
      const validation = this.validatePhoneNumber(phoneNumber);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Invalid phone number',
          code: 'INVALID_PHONE'
        };
      }

      // Call backend function
      const result = await web.callFunction('resendOTP', { phoneNumber });

      if (result.ok) {
        return result.item as OTPResponse;
      } else {
        return {
          success: false,
          message: result.error?.message || 'Failed to resend OTP',
          code: 'RESEND_ERROR'
        };
      }
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to resend OTP',
        code: 'RESEND_ERROR'
      };
    }
  }

  /**
   * Clears OTP for testing
   */
  async clearOTP(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await web.callFunction('clearOTP', { phoneNumber });

      if (result.ok) {
        return result.item;
      } else {
        return {
          success: false,
          message: result.error?.message || 'Failed to clear OTP'
        };
      }
    } catch (error: any) {
      console.error('Error clearing OTP:', error);
      return {
        success: false,
        message: error.message || 'Failed to clear OTP'
      };
    }
  }

  /**
   * Gets OTP status for testing
   */
  async getOTPStatus(phoneNumber: string): Promise<any> {
    try {
      const result = await web.callFunction('getOTPStatus', { phoneNumber });

      if (result.ok) {
        return result.item;
      } else {
        return {
          exists: false,
          message: result.error?.message || 'Failed to get OTP status'
        };
      }
    } catch (error: any) {
      console.error('Error getting OTP status:', error);
      return {
        exists: false,
        message: error.message || 'Failed to get OTP status'
      };
    }
  }
}

export const messageCenterOTPService = new MessageCenterOTPService();
