import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext, isSameOriginPost } from '@/lib/server/admin-auth'
import { isStaffRole } from '@/lib/admin-access'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginPost(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  const admin = await getAdminContext(['super_admin'])
  if (!admin) return NextResponse.json({ error: 'Owner access required.' }, { status: 403 })

  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid staff account.' }, { status: 400 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid update.' }, { status: 400 })

  const update: { full_name?: string; role?: string; is_active?: boolean } = {}
  if ('full_name' in body) {
    if (typeof body.full_name !== 'string' || body.full_name.trim().length < 2 || body.full_name.trim().length > 80) {
      return NextResponse.json({ error: 'Name must be 2 to 80 characters.' }, { status: 400 })
    }
    update.full_name = body.full_name.trim()
  }
  if ('role' in body) {
    if (!isStaffRole(body.role)) return NextResponse.json({ error: 'Invalid staff role.' }, { status: 400 })
    update.role = body.role
  }
  if ('is_active' in body) {
    if (typeof body.is_active !== 'boolean') return NextResponse.json({ error: 'Invalid account status.' }, { status: 400 })
    update.is_active = body.is_active
  }
  if (Object.keys(update).length === 0) return NextResponse.json({ error: 'No changes provided.' }, { status: 400 })
  if (id === admin.userId && (update.role !== undefined || update.is_active === false)) {
    return NextResponse.json({ error: 'You cannot remove your own owner access.' }, { status: 400 })
  }

  const { data, error } = await admin.service
    .from('admin_profiles')
    .update(update)
    .eq('id', id)
    .select('id, email, full_name, role, is_active, created_at')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not update staff account.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Staff account not found.' }, { status: 404 })
  return NextResponse.json({ staff: data }, { headers: { 'Cache-Control': 'no-store' } })
}
