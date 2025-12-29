import { ok, badRequest, serverError } from 'wix-http-functions';
import { sendOTP, verifyOTP, resendOTP, clearOTP, getOTPStatus } from '../messageCentral.jsw';

/**
 * HTTP endpoint for sending OTP
 * POST /_functions/sendOTP
 */
export async function post_sendOTP(request) {
  try {
    const body = request.body ? JSON.parse(request.body) : {};
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return badRequest({
        success: false,
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    const result = await sendOTP(phoneNumber);
    return ok(result);
  } catch (error) {
    console.error('Error in sendOTP endpoint:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to send OTP',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * HTTP endpoint for verifying OTP
 * POST /_functions/verifyOTP
 */
export async function post_verifyOTP(request) {
  try {
    const body = request.body ? JSON.parse(request.body) : {};
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      return badRequest({
        success: false,
        valid: false,
        message: 'Phone number and OTP code are required',
        code: 'MISSING_PARAMS'
      });
    }

    const result = await verifyOTP(phoneNumber, code);
    return ok(result);
  } catch (error) {
    console.error('Error in verifyOTP endpoint:', error);
    return serverError({
      success: false,
      valid: false,
      message: error.message || 'Failed to verify OTP',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * HTTP endpoint for resending OTP
 * POST /_functions/resendOTP
 */
export async function post_resendOTP(request) {
  try {
    const body = request.body ? JSON.parse(request.body) : {};
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return badRequest({
        success: false,
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    const result = await resendOTP(phoneNumber);
    return ok(result);
  } catch (error) {
    console.error('Error in resendOTP endpoint:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to resend OTP',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * HTTP endpoint for clearing OTP (testing only)
 * POST /_functions/clearOTP
 */
export async function post_clearOTP(request) {
  try {
    const body = request.body ? JSON.parse(request.body) : {};
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return badRequest({
        success: false,
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    const result = clearOTP(phoneNumber);
    return ok(result);
  } catch (error) {
    console.error('Error in clearOTP endpoint:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to clear OTP',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * HTTP endpoint for getting OTP status (testing only)
 * POST /_functions/getOTPStatus
 */
export async function post_getOTPStatus(request) {
  try {
    const body = request.body ? JSON.parse(request.body) : {};
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return badRequest({
        success: false,
        message: 'Phone number is required',
        code: 'MISSING_PHONE'
      });
    }

    const result = getOTPStatus(phoneNumber);
    return ok(result);
  } catch (error) {
    console.error('Error in getOTPStatus endpoint:', error);
    return serverError({
      success: false,
      message: error.message || 'Failed to get OTP status',
      code: 'SERVER_ERROR'
    });
  }
}
