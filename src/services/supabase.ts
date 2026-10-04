import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL_KEY = 'spendly_supabase_url';
const SUPABASE_ANON_KEY_KEY = 'spendly_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;

export function getStoredSupabaseConfig(): { url: string; anonKey: string } | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && envUrl !== 'https://your-project.supabase.co' && !envUrl.includes('placeholder')) {
    return { url: envUrl, anonKey: envKey };
  }

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY);
  const storedKey = localStorage.getItem(SUPABASE_ANON_KEY_KEY);

  if (storedUrl && storedKey) {
    return { url: storedUrl, anonKey: storedKey };
  }

  return null;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY_KEY, anonKey.trim());
  cachedClient = null; // reset
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(SUPABASE_URL_KEY);
  localStorage.removeItem(SUPABASE_ANON_KEY_KEY);
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const config = getStoredSupabaseConfig();
  return !!(config && config.url && config.anonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredSupabaseConfig();
  if (!config) return null;

  if (!cachedClient) {
    try {
      cachedClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return cachedClient;
}
