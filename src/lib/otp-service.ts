/**
 * OTP Service - Handles OTP operations via Lambda
 */

export type OTPType = 'login' | 'register' | 'reset_password' | 'verify_email' | 'driver_register' | 'sensitive_action';

export interface SendOTPResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

export interface VerifyOTPResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

// Get the Lambda URL from environment
const OTP_LAMBDA_URL = import.meta.env.VITE_OTP_LAMBDA_URL || 'https://o7voyhz35ketac4igeohlpdrxi0jhplj.lambda-url.me-south-1.on.aws';

/**
 * Send OTP to email
 */
export async function sendOtp(email: string, type: OTPType = 'login'): Promise<SendOTPResponse> {
  try {
    const response = await fetch(`${OTP_LAMBDA_URL}/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        type: type.toLowerCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Failed to send OTP',
      };
    }

    return {
      success: true,
      message: data.message || 'OTP sent to your email',
    };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOtp(email: string, code: string, type: OTPType = 'login'): Promise<VerifyOTPResponse> {
  try {
    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return {
        error: 'Invalid OTP format. Please enter 6 digits.',
      };
    }

    const response = await fetch(`${OTP_LAMBDA_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        code: code.trim(),
        type: type.toLowerCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Failed to verify OTP',
      };
    }

    return {
      success: true,
      message: data.message || 'OTP verified successfully',
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Resend OTP (calls send-otp again, respects rate limits)
 */
export async function resendOtp(email: string, type: OTPType = 'login'): Promise<SendOTPResponse> {
  return sendOtp(email, type);
}
