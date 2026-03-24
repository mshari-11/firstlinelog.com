import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { phone } = await req.json()
    if (!phone) return new Response(JSON.stringify({ error: 'رقم الجوال مطلوب' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    let cleanPhone = phone.replace(/s+/g, '').replace(/[^0-9+]/g, '')
    if (cleanPhone.startsWith('05')) cleanPhone = '966' + cleanPhone.substring(1)
    else if (cleanPhone.startsWith('+966')) cleanPhone = cleanPhone.substring(1)
    else if (cleanPhone.startsWith('5')) cleanPhone = '966' + cleanPhone
    if (!/^9665d{8}$/.test(cleanPhone)) return new Response(JSON.stringify({ error: 'رقم جوال سعودي غير صحيح' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    await supabase.from('otp_verifications').delete().eq('phone', cleanPhone).eq('used', false)
    await supabase.from('otp_verifications').insert({ phone: cleanPhone, otp_code: otpCode, purpose: 'login', expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() })
    return new Response(JSON.stringify({ success: true, message: 'تم إرسال رمز التحقق' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'حدث خطأ غير متوقع' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
