import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only admin client. The service-role key never reaches the browser, so the
// confidential state is reachable only through the passphrase-gated API routes.
// Returns null when unconfigured (local dev / CI) so the app falls back to localStorage.
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  // Server-only key (never NEXT_PUBLIC). Service-role preferred; publishable/anon works too.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
