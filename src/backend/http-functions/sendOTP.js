import { ok, badRequest, serverError } from 'wix-http-functions';
import { sendOTP } from '../messageCentral.jsw';

/**
 * HTTP endpoint for sending OTP
 * POST /_functions/sendOTP
 * 
 * @param {Object} request - The HTTP request object
 * @param {string} request.body - JSON string containing { phoneNumber: string }
 * @returns {Promise<Object>} Response with OTP send status
 */
export async function post_sendOTP(request) {
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
    console.log(`[sendOTP] Received request for phone: ${phoneNumber.replace(/\d(?=\d{4})/g, '*')}`);

    const result = await sendOTP(phoneNumber);
    
    // Log success
    if (result.success) {
      console.log(`[sendOTP] OTP sent successfully to ${result.phoneNumber}`);
    } else {
      console.warn(`[sendOTP] Failed to send OTP: ${result.message}`);
    }

    return ok(result);
  } catch (error) {
    console.error('[sendOTP] Server error:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to send OTP',
      code: 'SERVER_ERROR'
    });
  }
}
