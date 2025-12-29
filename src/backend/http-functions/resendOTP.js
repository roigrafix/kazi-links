import { ok, badRequest, serverError } from 'wix-http-functions';
import { resendOTP } from '../messageCentral.jsw';

/**
 * HTTP endpoint for resending OTP
 * POST /_functions/resendOTP
 * 
 * @param {Object} request - The HTTP request object
 * @param {string} request.body - JSON string containing { phoneNumber: string }
 * @returns {Promise<Object>} Response with OTP resend status
 */
export async function post_resendOTP(request) {
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
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        });
      }
    }

    const { phoneNumber } = body;

    if (!phoneNumber) {
      return badRequest({
        success: false,
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    // Log the request for debugging
    console.log(`[resendOTP] Received resend request for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    const result = await resendOTP(phoneNumber);
    
    // Log result
    if (result.success) {
      console.log(`[resendOTP] OTP resent successfully to ${result.phoneNumber}`);
    } else {
      console.warn(`[resendOTP] Failed to resend OTP: ${result.message}`);
    }

    return ok(result);
  } catch (error) {
    console.error('[resendOTP] Server error:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to resend OTP',
      code: 'SERVER_ERROR'
    });
  }
}
