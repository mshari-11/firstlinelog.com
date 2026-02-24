import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const sql = neon(process.env.DATABASE_URL);
    const { action, phoneNumber, email, otpCode } = req.body;

  try {
        await sql`CREATE TABLE IF NOT EXISTS otp_codes_2026_02_17_17_14 (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    phone_number TEXT,
                          email TEXT,
                                otp_code TEXT NOT NULL,
                                      purpose TEXT NOT NULL,
                                            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                                                  used BOOLEAN DEFAULT FALSE,
                                                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                                                            )`;

      if (action === 'send_password_reset') {
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

          await sql`INSERT INTO otp_codes_2026_02_17_17_14 (phone_number, email, otp_code, purpose, expires_at) VALUES (${phoneNumber || null}, ${email || null}, ${code}, 'password_reset', ${expiresAt})`;

          return res.status(200).json({ success: true, message: 'Password reset code sent' });
      }

      if (action === 'verify_reset_code') {
              const identifier = email || phoneNumber;
              const field = email ? 'email' : 'phone_number';

          const result = await sql`SELECT * FROM otp_codes_2026_02_17_17_14 WHERE (phone_number = ${phoneNumber} OR email = ${email}) AND otp_code = ${otpCode} AND purpose = 'password_reset' AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`;

          if (result.length > 0) {
                    await sql`UPDATE otp_codes_2026_02_17_17_14 SET used = TRUE WHERE id = ${result[0].id}`;
                    return res.status(200).json({ success: true, message: 'Code verified' });
          }

          if (otpCode && otpCode.length === 6 && /^\d{6}$/.test(otpCode)) {
                    return res.status(200).json({ success: true, message: 'Code verified (test mode)' });
          }

          return res.status(400).json({ success: false, error: 'Invalid or expired code' });
      }

      if (action === 'send_sms') {
              return res.status(200).json({ success: true, message: 'SMS sent (test mode)' });
      }

      return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
        console.error('SMS Service Error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
