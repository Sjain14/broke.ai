import { createClient } from '@supabase/supabase-js';

// Fallback to placeholder if environment variables are missing so the client doesn't crash during build/dev
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Ensures the current browser session has an anonymous auth UUID.
 * If no session exists, signs in anonymously so RLS policies work.
 * Safe to call multiple times — it's a no-op if already authenticated.
 */
export async function ensureAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error('Supabase anon auth failed:', error.message);
    }
  } catch (e) {
    console.error('ensureAuth error:', e);
  }
}
