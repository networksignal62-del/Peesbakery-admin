import 'server-only'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient as createUserClient } from '@/lib/supabase/server'
import { isStaffRole, type StaffRole } from '@/lib/admin-access'
import { getSupabasePublicKey } from '@/lib/supabase/config'

export async function getAdminContext(allowedRoles?: readonly StaffRole[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = getSupabasePublicKey()
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) return null

  const userClient = await createUserClient()
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return null

  const service = createServiceClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: profile, error: profileError } = await service
    .from('admin_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.is_active || !isStaffRole(profile.role)) return null
  if (allowedRoles && !allowedRoles.includes(profile.role)) return null
  return { userId: user.id, role: profile.role, service }
}

export function isSameOriginPost(request: Request) {
  const origin = request.headers.get('origin')
  return Boolean(origin && origin === new URL(request.url).origin)
}
