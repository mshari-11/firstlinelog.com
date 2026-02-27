/**
 * إعداد عميل Supabase لموقع فيرست لاين لوجستيكس
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Create and export the supabase client for database queries
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

/**
 * إرسال رمز التحقق OTP
 */
export async function sendOTP(phone: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  debug_code?: string;
}> {
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

/**
 * التحقق من رمز OTP وتسجيل الدخول
 */
export async function verifyOTP(phone: string, code: string): Promise<{
  success?: boolean;
  error?: string;
  user?: {
    id: string;
    phone: string;
    name: string | null;
    role: string;
  };
  session?: {
    token: string;
    expires_at: string;
  };
  is_new_user?: boolean;
  message?: string;
}> {
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  return res.json();
}
