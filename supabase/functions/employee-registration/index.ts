import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, X-Client-Info, apikey, Content-Type, X-Application-Name',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    if (req.method === 'POST') {
      const {
        fullName, nationalId, nationality, workCity, contractStatus,
        email, workApp, bankName, bankAccount, iban, phoneNumber,
        username, password, otpVerified = true
      } = await req.json()

      if (!fullName || !nationalId || !email || !phoneNumber || !username || !password) {
        return new Response(
          JSON.stringify({ error: 'البيانات المطلوبة ناقصة' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const passwordHash = btoa(password)

      const { data, error } = await supabaseClient
        .from('employees_2026_02_17_17_14')
        .insert([{
          full_name: fullName, national_id: nationalId, nationality,
          work_city: workCity, contract_status: contractStatus, email,
          work_app: workApp, bank_name: bankName, bank_account: bankAccount,
          iban, phone_number: phoneNumber, username,
          password_hash: passwordHash, otp_verified: otpVerified, status: 'pending'
        }])
        .select()

      if (error) {
        if (error.code === '23505') {
          let errorMessage = 'البيانات مكررة'
          if (error.message.includes('national_id')) errorMessage = 'رقم الهوية مسجل مسبقاً'
          else if (error.message.includes('email')) errorMessage = 'البريد الإلكتروني مسجل مسبقاً'
          else if (error.message.includes('username')) errorMessage = 'اسم المستخدم مسجل مسبقاً'
          return new Response(JSON.stringify({ error: errorMessage }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({ error: 'حدث خطأ في حفظ البيانات' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(
        JSON.stringify({ success: true, message: 'تم تسجيل البيانات بنجاح', employeeId: data[0].id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: 'حدث خطأ في الخادم' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
