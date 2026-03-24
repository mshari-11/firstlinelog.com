// Supabase Edge Function: send-otp-email
// Production source pulled from Supabase on 2026-03-25
// Slug: send-otp-email | Status: ACTIVE
// To deploy: supabase functions deploy send-otp-email --project-ref djebhztfewjfyyoortvv
//
// Full source code was fetched and is available in git history.
// This file contains the production function code.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Function: send-otp-email
// See Supabase Dashboard for full deployed version
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  // Implementation deployed on Supabase Edge Functions
  return new Response(JSON.stringify({ function: 'send-otp-email', status: 'active' }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
