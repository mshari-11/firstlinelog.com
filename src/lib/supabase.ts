import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase client — initialized from VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.
 * Returns null only when env vars are absent (dev without .env).
 * Auth module and other callers already handle the null case gracefully.
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

if (!supabase) {
  console.warn(
    "[FLL] Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env"
  );
}
