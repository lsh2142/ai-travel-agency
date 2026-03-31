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
    // auth 검증 전용 클라이언트 — global Authorization 헤더 없이 getUser(jwt) 사용
    // (global header는 DB 쿼리용. auth 검증에 섞으면 요청이 중복될 수 있음)
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data: { user }, error } = await authClient.auth.getUser(accessToken);
    if (error || !user) return null;
    return { user, accessToken };
  } catch {
    return null;
  }
}
