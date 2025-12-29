import { ok, badRequest, serverError } from 'wix-http-functions';
import { clearOTP } from '../messageCentral.jsw';

/**
 * HTTP endpoint for clearing OTP (testing only)
 * POST /_functions/clearOTP
 * 
 * @param {Object} request - The HTTP request object
 * @param {string} request.body - JSON string containing { phoneNumber: string }
 * @returns {Promise<Object>} Response with OTP clear status
 */
export async function post_clearOTP(request) {
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
    console.log(`[clearOTP] Received clear request for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    const result = await clearOTP(phoneNumber);
    
    console.log(`[clearOTP] OTP cleared for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    return ok(result);
  } catch (error) {
    console.error('[clearOTP] Server error:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to clear OTP',
      code: 'SERVER_ERROR'
    });
  }
}
