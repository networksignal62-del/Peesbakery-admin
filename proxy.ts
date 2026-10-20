import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessAdminPath, defaultAdminPath, isStaffRole } from '@/lib/admin-access'
import { getSupabasePublicKey } from '@/lib/supabase/config'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = getSupabasePublicKey()

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Staff sign-in is temporarily unavailable.' }, { status: 503 })
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminRoute = request.nextUrl.pathname === '/admin' || request.nextUrl.pathname.startsWith('/admin/')
  const isAdminLogin = request.nextUrl.pathname === '/admin/login'
  const isInviteWelcome = request.nextUrl.pathname === '/admin/welcome'

  function redirect(path: string) {
    const response = NextResponse.redirect(new URL(path, request.url))
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }

  if (isAdminRoute && !isAdminLogin && !isInviteWelcome) {
    if (!user) {
      return redirect('/admin/login')
    }

    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!adminProfile || !isStaffRole(adminProfile.role)) {
      return redirect('/admin/login')
    }
    if (!canAccessAdminPath(adminProfile.role, request.nextUrl.pathname)) {
      return redirect(defaultAdminPath(adminProfile.role))
    }
  }

  if (isAdminLogin && user) {
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminProfile && isStaffRole(adminProfile.role)) {
      return redirect(defaultAdminPath(adminProfile.role))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
