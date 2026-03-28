/**
 * FLL Send OTP Email — Supabase Edge Function
 * Generates 6-digit OTP, stores in admin_otp_codes, sends via AWS SES
 *
 * Required Supabase secrets:
 *   supabase secrets set AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_REGION=me-south-1
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FROM_EMAIL = 'no-reply@fll.sa'
const FROM_NAME = 'First Line Logistics'
const OTP_EXPIRY_MINUTES = 10
const MAX_REQUESTS_PER_10MIN = 5

function generateOTP(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(100000 + (array[0] % 900000))
}

async function sendViaSES(email: string, code: string): Promise<boolean> {
  const accessKey = Deno.env.get('AWS_ACCESS_KEY_ID')
  const secretKey = Deno.env.get('AWS_SECRET_ACCESS_KEY')
  const region = Deno.env.get('AWS_REGION') || 'me-south-1'

  if (!accessKey || !secretKey) {
    console.warn('AWS credentials not set — cannot send SES email')
    return false
  }

  const host = `email.${region}.amazonaws.com`
  const endpoint = `https://${host}/v2/email/outbound-emails`
  const now = new Date()
  const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const shortDate = dateStamp.substring(0, 8)

  const body = JSON.stringify({
    Content: {
      Simple: {
        Subject: { Data: `رمز التحقق: ${code}`, Charset: 'UTF-8' },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <div dir="rtl" style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:500px;margin:0 auto;padding:30px;background:#0b1622;color:#e2e8f0;border-radius:16px;">
                <div style="text-align:center;margin-bottom:24px;">
                  <h2 style="color:#c9a84c;margin:0;">First Line Logistics</h2>
                  <p style="color:#7e8ca2;font-size:14px;">رمز التحقق الثنائي</p>
                </div>
                <div style="background:rgba(15,25,40,0.8);border:1px solid rgba(59,130,246,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
                  <p style="color:#cbd5e1;font-size:14px;margin:0 0 12px;">رمز التحقق الخاص بك:</p>
                  <div style="font-size:36px;font-weight:800;letter-spacing:12px;color:#60a5fa;font-family:monospace;">${code}</div>
                </div>
                <p style="color:#7e8ca2;font-size:12px;text-align:center;">صالح لمدة ${OTP_EXPIRY_MINUTES} دقائق. لا تشاركه مع أحد.</p>
              </div>
            `
          }
        }
      }
    },
    Destination: { ToAddresses: [email] },
    FromEmailAddress: `${FROM_NAME} <${FROM_EMAIL}>`
  })

  // AWS Signature V4
  const encoder = new TextEncoder()
  async function hmacSHA256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  }
  async function sha256(data: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  const payloadHash = await sha256(body)
  const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${dateStamp}\n`
  const signedHeaders = 'content-type;host;x-amz-date'
  const canonicalRequest = `POST\n/v2/email/outbound-emails\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
  const credentialScope = `${shortDate}/${region}/ses/aws4_request`
  const stringToSign = `AWS4-HMAC-SHA256\n${dateStamp}\n${credentialScope}\n${await sha256(canonicalRequest)}`

  let signingKey = encoder.encode(`AWS4${secretKey}`)
  for (const part of [shortDate, region, 'ses', 'aws4_request']) {
    signingKey = new Uint8Array(await hmacSHA256(signingKey, part))
  }
  const signatureBytes = await hmacSHA256(signingKey, stringToSign)
  const signature = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('')
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': host,
        'X-Amz-Date': dateStamp,
        'Authorization': authorization,
      },
      body,
    })
    if (res.ok) {
      console.log('SES email sent successfully to', email)
      return true
    }
    const errText = await res.text()
    console.error('SES error:', res.status, errText)
    return false
  } catch (e) {
    console.error('SES fetch error:', e)
    return false
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, type } = await req.json()
    if (!email) {
      return new Response(JSON.stringify({ error: 'البريد الإلكتروني مطلوب' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cleanEmail = email.toLowerCase().trim()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Rate limiting: max 5 OTPs per 10 minutes
    const tenMinAgo = Math.floor(Date.now() / 1000) - 600
    const { count } = await supabase
      .from('admin_otp_codes')
      .select('id', { count: 'exact', head: true })
      .eq('email', cleanEmail)
      .gte('created_at', tenMinAgo)

    if ((count || 0) >= MAX_REQUESTS_PER_10MIN) {
      return new Response(JSON.stringify({ error: 'تم تجاوز الحد المسموح. انتظر 10 دقائق.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate and store OTP
    const code = generateOTP()
    const expiresAt = Math.floor(Date.now() / 1000) + (OTP_EXPIRY_MINUTES * 60)

    // Invalidate previous unused codes
    await supabase
      .from('admin_otp_codes')
      .update({ used: true })
      .eq('email', cleanEmail)
      .eq('used', false)

    // Insert new code
    const { error: insertErr } = await supabase
      .from('admin_otp_codes')
      .insert({ email: cleanEmail, code, expires_at: expiresAt, used: false })

    if (insertErr) {
      console.error('DB insert error:', insertErr)
      return new Response(JSON.stringify({ error: 'خطأ في النظام' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Send email via SES
    const emailSent = await sendViaSES(cleanEmail, code)

    return new Response(JSON.stringify({
      success: true,
      message: emailSent ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'تم إنشاء رمز التحقق',
      email_sent: emailSent,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('Error:', e)
    return new Response(JSON.stringify({ error: 'حدث خطأ غير متوقع' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
