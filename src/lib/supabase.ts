/**
 * إعداد عميل Supabase لموقع فيرست لاين لوجستيكس
 */

const SUPABASE_URL = 'https://djebhztfewjfyyoortvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2NzYzMDEsImV4cCI6MjA1MjI1MjMwMX0.sHHPAhHlp4jOwIbnMaDhFsmMNunnNMBjLSF-6STEfMo';

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
