import { ok, badRequest, serverError } from 'wix-http-functions';
import { verifyOTP } from '../messageCentral.jsw';

/**
 * HTTP endpoint for verifying OTP
 * POST /_functions/verifyOTP
 * 
 * @param {Object} request - The HTTP request object
 * @param {string} request.body - JSON string containing { phoneNumber: string, code: string }
 * @returns {Promise<Object>} Response with OTP verification status
 */
export async function post_verifyOTP(request) {
  try {
    // Safely parse request body
    let body = {};
    if (request.body) {
      try {
        body = JSON.parse(request.body);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return badRequest({
          success: false,
          valid: false,
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        });
      }
    }

    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return badRequest({
        success: false,
        valid: false,
        message: 'Phone number and OTP code are required',
        code: 'MISSING_PARAMS'
      });
    }

    // Log the request for debugging (mask phone number)
    console.log(`[verifyOTP] Received verification request for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    const result = await verifyOTP(phoneNumber, code);
    
    // Log result
    if (result.success && result.valid) {
      console.log(`[verifyOTP] OTP verified successfully for ${result.phoneNumber}`);
    } else {
      console.warn(`[verifyOTP] Verification failed: ${result.message}`);
    }

    return ok(result);
  } catch (error) {
    console.error('[verifyOTP] Server error:', error);
    return serverError({
      success: false,
      valid: false,
      message: error.message || 'Failed to verify OTP',
      code: 'SERVER_ERROR'
    });
  }
}
