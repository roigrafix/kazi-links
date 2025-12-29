import { ok, badRequest, serverError } from 'wix-http-functions';
import { getOTPStatus } from '../messageCentral.jsw';

/**
 * HTTP endpoint for getting OTP status (testing only)
 * POST /_functions/getOTPStatus
 * 
 * @param {Object} request - The HTTP request object
 * @param {string} request.body - JSON string containing { phoneNumber: string }
 * @returns {Promise<Object>} Response with OTP status
 */
export async function post_getOTPStatus(request) {
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
    console.log(`[getOTPStatus] Received status request for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    const result = getOTPStatus(phoneNumber);
    
    console.log(`[getOTPStatus] Status retrieved for ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    return ok(result);
  } catch (error) {
    console.error('[getOTPStatus] Server error:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to get OTP status',
      code: 'SERVER_ERROR'
    });
  }
}
