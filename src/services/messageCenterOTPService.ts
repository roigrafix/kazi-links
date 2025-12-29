// Configuration constants
const OTP_REQUEST_TIMEOUT = 30000; // 30 seconds timeout
const OTP_ENDPOINT_BASE = '/_functions';
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

// Rate limiting store
const requestTracker = new Map<string, number[]>();

/**
 * Validates response structure matches expected interface
 */
function validateOTPResponse(data: any): data is OTPResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.success === 'boolean' &&
    typeof data.message === 'string'
  );
}

/**
 * Validates verification response structure
 */
function validateVerifyResponse(data: any): data is VerifyResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.success === 'boolean' &&
    typeof data.valid === 'boolean' &&
    typeof data.message === 'string'
  );
}

/**
 * Checks if request should be rate limited
 */
function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const requests = requestTracker.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  // Update tracker
  recentRequests.push(now);
  requestTracker.set(identifier, recentRequests);
  
  return false;
}

/**
 * Helper function to call backend HTTP functions with timeout
 */
async function callBackendFunction(functionName: string, params: any): Promise<any> {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OTP_REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${OTP_ENDPOINT_BASE}/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // Response is not JSON
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }

        const errorMessage = errorData.message || `HTTP ${response.status}`;
        const errorCode = errorData.code || 'HTTP_ERROR';

        throw new Error(`[${errorCode}] ${errorMessage}`);
      }

      // Parse and validate response
      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid JSON response from server');
      }

      return data;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timeout - server took too long to respond');
      }

      // Handle network errors
      if (fetchError instanceof TypeError) {
        throw new Error('Network error - unable to reach server');
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

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

      // Check rate limiting
      if (isRateLimited(`send_${phoneNumber}`)) {
        return {
          success: false,
          message: 'Too many requests. Please wait before trying again.',
          code: 'RATE_LIMITED'
        };
      }

      // Call backend function
      const result = await callBackendFunction('sendOTP', { phoneNumber });
      
      // Validate response structure
      if (!validateOTPResponse(result)) {
        console.error('Invalid response structure from sendOTP:', result);
        return {
          success: false,
          message: 'Invalid response from server',
          code: 'INVALID_RESPONSE'
        };
      }

      return result as OTPResponse;
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

      // Check rate limiting
      if (isRateLimited(`verify_${phoneNumber}`)) {
        return {
          success: false,
          valid: false,
          message: 'Too many verification attempts. Please wait before trying again.',
          code: 'RATE_LIMITED'
        };
      }

      // Call backend function
      const result = await callBackendFunction('verifyOTP', { 
        phoneNumber, 
        code 
      });

      // Validate response structure
      if (!validateVerifyResponse(result)) {
        console.error('Invalid response structure from verifyOTP:', result);
        return {
          success: false,
          valid: false,
          message: 'Invalid response from server',
          code: 'INVALID_RESPONSE'
        };
      }

      return result as VerifyResponse;
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

      // Check rate limiting
      if (isRateLimited(`resend_${phoneNumber}`)) {
        return {
          success: false,
          message: 'Too many resend requests. Please wait before trying again.',
          code: 'RATE_LIMITED'
        };
      }

      // Call backend function
      const result = await callBackendFunction('resendOTP', { phoneNumber });

      // Validate response structure
      if (!validateOTPResponse(result)) {
        console.error('Invalid response structure from resendOTP:', result);
        return {
          success: false,
          message: 'Invalid response from server',
          code: 'INVALID_RESPONSE'
        };
      }

      return result as OTPResponse;
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
      const result = await callBackendFunction('clearOTP', { phoneNumber });
      return result;
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
      const result = await callBackendFunction('getOTPStatus', { phoneNumber });
      return result;
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
