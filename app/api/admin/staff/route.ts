import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, isSameOriginPost } from '@/lib/server/admin-auth'
import { isStaffRole } from '@/lib/admin-access'

export const runtime = 'nodejs'

export async function GET() {
  const admin = await getAdminContext(['super_admin'])
  if (!admin) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })

  const { data, error } = await admin.service
    .from('admin_profiles')
    .select('id, email, full_name, role, is_active, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Could not load staff accounts.' }, { status: 500 })
  return NextResponse.json({ staff: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  if (!isSameOriginPost(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  const admin = await getAdminContext(['super_admin'])
  if (!admin) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const fullName = typeof body?.full_name === 'string' ? body.full_name.trim() : ''
  const role = body?.role
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || fullName.length < 2 || fullName.length > 80 || !isStaffRole(role)) {
    return NextResponse.json({ error: 'Enter a valid email, name, and staff role.' }, { status: 400 })
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peesbakery.rest'}/admin/welcome`
  const { data: invitation, error: inviteError } = await admin.service.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (inviteError || !invitation.user) {
    return NextResponse.json({ error: 'Invitation could not be sent. Check whether this email already has an account.' }, { status: 409 })
  }

  const { error: profileError } = await admin.service.from('admin_profiles').insert({
    id: invitation.user.id,
    email,
    full_name: fullName,
    role,
    is_active: true,
  })
  if (profileError) {
    await admin.service.auth.admin.deleteUser(invitation.user.id)
    return NextResponse.json({ error: 'Invitation could not be completed. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ id: invitation.user.id, message: 'Invitation sent.' }, { status: 201 })
}
