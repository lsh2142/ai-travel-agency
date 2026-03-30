import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const ACCESS_TOKEN_COOKIE = 'sb-access-token';
export const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
// Server-side: these are validated at runtime when createServerClient is called

/** Server-side Supabase client that authenticates as the given user */
export function createServerClient(accessToken: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });
}

/** Read session from httpOnly cookies (server-side only) */
export async function getServerSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  try {
    const client = createServerClient(accessToken);
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    if (error || !user) return null;
    return { user, accessToken };
  } catch {
    return null;
  }
}
