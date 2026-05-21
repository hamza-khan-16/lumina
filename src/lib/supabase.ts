// ─── Supabase Client ────────────────────────────────────────────────────────
// Get your URL and anon key from:
// Supabase Dashboard → Project Settings → API
// ───────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
