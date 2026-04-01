/**
 * OTP Service - Handles OTP operations via Lambda
 */

export type OTPType =
  | "login"
  | "register"
  | "reset_password"
  | "verify_email"
  | "driver_register"
  | "sensitive_action";

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

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://djebhztfewjfyyoortvv.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Send OTP to email — tries API Gateway first, falls back to Supabase edge function
 */
export async function sendOtp(
  email: string,
  type: OTPType = "login",
): Promise<SendOTPResponse> {
  const payload = {
    email: email.toLowerCase().trim(),
    type: type.toLowerCase(),
  };

  // Attempt 1: API Gateway Lambda
  try {
    const response = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || "OTP sent to your email",
      };
    }
    // If service is disabled (410) or other client error, fall through to email OTP
    if (data.disabled) {
      console.warn("SMS OTP disabled, falling back to email OTP");
    } else if (response.status < 500 && response.status !== 410) {
      return { error: data.error || "Failed to send OTP" };
    }
  } catch (e) {
    console.warn("API Gateway OTP failed, trying email OTP:", e);
  }

  // Attempt 2: Supabase send-otp-email edge function (sends OTP via AWS SES)
  try {
    const emailPayload = {
      email: payload.email,
      full_name: "",
    };
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
      headers["apikey"] = SUPABASE_ANON_KEY;
    }
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-otp-email`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(emailPayload),
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success) {
      return {
        success: true,
        message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
      };
    }
    if (data.message || data.error) {
      return { error: data.message || data.error };
    }
  } catch (e) {
    console.warn("Email OTP also failed:", e);
  }

  return { error: "تعذّر إرسال رمز التحقق. يرجى المحاولة لاحقاً." };
}

/**
 * Verify OTP code
 */
export async function verifyOtp(
  email: string,
  code: string,
  type: OTPType = "login",
): Promise<VerifyOTPResponse> {
  if (!/^\d{6}$/.test(code)) {
    return { error: "أدخل رمز التحقق بشكل صحيح (6 أرقام)" };
  }

  const payload = {
    email: email.toLowerCase().trim(),
    code: code.trim(),
    type: type.toLowerCase(),
  };

  // Attempt 1: API Gateway Lambda
  try {
    const response = await fetch(`${API_BASE}/auth/verify-custom-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (response.ok && (data.success || data.verified)) {
      return {
        success: true,
        message: data.message || "تم التحقق بنجاح",
      };
    }
    if (response.status < 500) {
      return { error: data.error || data.message || "رمز التحقق غير صحيح" };
    }
  } catch (e) {
    console.warn("API Gateway verify failed, trying email verify:", e);
  }

  // Attempt 2: Supabase verify-email-otp edge function
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (SUPABASE_ANON_KEY) {
      headers["Authorization"] = `Bearer ${SUPABASE_ANON_KEY}`;
      headers["apikey"] = SUPABASE_ANON_KEY;
    }
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/verify-email-otp`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ email: payload.email, code: payload.code }),
        signal: AbortSignal.timeout(10000),
      },
    );
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message || "تم التحقق بنجاح",
      };
    }
    if (data.message || data.error) {
      return { error: data.message || data.error };
    }
  } catch (e) {
    console.warn("Email OTP verify also failed:", e);
  }

  return { error: "تعذّر التحقق من الرمز. يرجى المحاولة مرة أخرى." };
}

/**
 * Resend OTP (calls send-otp again, respects rate limits)
 */
export async function resendOtp(
  email: string,
  type: OTPType = "login",
): Promise<SendOTPResponse> {
  return sendOtp(email, type);
}
