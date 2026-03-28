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

import { API_BASE } from "@/lib/api";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://djebhztfewjfyyoortvv.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Send OTP to email — tries API Gateway first, falls back to Supabase edge function
 */
export async function sendOtp(email: string, type: OTPType = 'login'): Promise<SendOTPResponse> {
  const payload = { email: email.toLowerCase().trim(), type: type.toLowerCase() };

  // Attempt 1: API Gateway Lambda
  try {
    const response = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message || 'OTP sent to your email' };
    }
    // If server returned an error (not network), check before falling back
    if (response.status < 500) {
      return { error: data.error || 'Failed to send OTP' };
    }
  } catch (e) {
    console.warn('API Gateway OTP failed, trying edge function:', e);
  }

  // Attempt 2: Supabase edge function
  if (SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && (data.success || data.message)) {
        return { success: true, message: data.message || 'OTP sent to your email' };
      }
    } catch (e) {
      console.warn('Edge function OTP also failed:', e);
    }
  }

  return { error: 'تعذّر إرسال رمز التحقق. يرجى المحاولة لاحقاً.' };
}

/**
 * Verify OTP code
 */
export async function verifyOtp(email: string, code: string, type: OTPType = 'login'): Promise<VerifyOTPResponse> {
  if (!/^\d{6}$/.test(code)) {
    return { error: 'أدخل رمز التحقق بشكل صحيح (6 أرقام)' };
  }

  const payload = { email: email.toLowerCase().trim(), code: code.trim(), type: type.toLowerCase() };

  // Attempt 1: API Gateway Lambda
  try {
    const response = await fetch(`${API_BASE}/auth/verify-custom-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, message: data.message || 'OTP verified successfully' };
    }
    if (response.status < 500) {
      return { error: data.error || 'رمز التحقق غير صحيح' };
    }
  } catch (e) {
    console.warn('API Gateway verify failed, trying edge function:', e);
  }

  // Attempt 2: Supabase edge function
  if (SUPABASE_ANON_KEY) {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && (data.success || data.verified)) {
        return { success: true, message: data.message || 'OTP verified successfully' };
      }
      if (data.error) return { error: data.error };
    } catch (e) {
      console.warn('Edge function verify also failed:', e);
    }
  }

  return { error: 'تعذّر التحقق من الرمز. يرجى المحاولة مرة أخرى.' };
}

/**
 * Resend OTP (calls send-otp again, respects rate limits)
 */
export async function resendOtp(email: string, type: OTPType = 'login'): Promise<SendOTPResponse> {
  return sendOtp(email, type);
}
