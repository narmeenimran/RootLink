export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url !== 'https://placeholder.supabase.co' &&
      !url.includes('YOUR_PROJECT') &&
      key !== 'placeholder-key' &&
      !key.includes('your-anon-key')
  );
}

export function getSupabaseConfigError(): string | null {
  if (isSupabaseConfigured()) return null;
  return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env, then restart the dev server.';
}
