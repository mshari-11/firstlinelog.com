import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "https://djebhztfewjfyyoortvv.supabase.co") as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWJoenRmZXdqZnl5b29ydHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODE2OTYsImV4cCI6MjA4NjY1NzY5Nn0.763DeRupf7g8pP4USMRnYSNT8WJcgckCFaeh3D2wml8") as string;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
