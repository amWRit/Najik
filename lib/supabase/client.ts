import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/types/database.types';

let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey
  );

  return supabaseInstance;
}

export const supabase = getSupabaseBrowserClient();
