/**
 * FLL Verify OTP — Supabase Edge Function
 * Checks OTP against admin_otp_codes table
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, code, type } = await req.json()
    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'البريد ورمز التحقق مطلوبان' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ error: 'رمز التحقق يجب أن يكون 6 أرقام' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const cleanEmail = email.toLowerCase().trim()
    const now = Math.floor(Date.now() / 1000)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Find valid OTP
    const { data, error } = await supabase
      .from('admin_otp_codes')
      .select('id, code, expires_at')
      .eq('email', cleanEmail)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (data.code !== code) {
      return new Response(JSON.stringify({ error: 'رمز التحقق غير صحيح' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mark as used
    await supabase
      .from('admin_otp_codes')
      .update({ used: true })
      .eq('id', data.id)

    return new Response(JSON.stringify({
      success: true,
      verified: true,
      message: 'تم التحقق بنجاح'
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('Verify error:', e)
    return new Response(JSON.stringify({ error: 'حدث خطأ غير متوقع' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
