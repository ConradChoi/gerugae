import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from '@/lib/supabase/env'

/**
 * 서비스 롤 클라이언트.
 *
 * 이 키는 RLS를 전부 우회한다. 브라우저로 새어 나가면 모든 회원의 모든 데이터가
 * 열리므로, 환경변수 이름에 NEXT_PUBLIC_ 을 붙여서는 절대 안 된다.
 * 맨 위의 'server-only' 가 클라이언트 번들에 딸려 들어가면 빌드를 실패시킨다.
 *
 * 지금은 회원 탈퇴(auth.users 삭제) 한 곳에서만 쓴다. 일반 조회·수정은
 * 회원 권한으로 충분하며, 서비스 롤을 쓰면 RLS 검증이 통째로 사라진다.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
