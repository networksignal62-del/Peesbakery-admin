export const STAFF_ROLES = ['super_admin', 'admin', 'manager', 'staff', 'waiter'] as const

export type StaffRole = (typeof STAFF_ROLES)[number]

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === 'string' && STAFF_ROLES.includes(value as StaffRole)
}

export function canManageCatalog(role: StaffRole) {
  return role === 'super_admin' || role === 'admin' || role === 'manager'
}

export function canManageOrders(role: StaffRole) {
  return role !== 'waiter'
}

export function defaultAdminPath(role: StaffRole) {
  return role === 'waiter' ? '/admin/menu' : '/admin'
}

export function canAccessAdminPath(role: StaffRole, pathname: string) {
  if (pathname === '/admin/account' || pathname.startsWith('/admin/account/')) return true
  if (pathname === '/admin/menu' || pathname.startsWith('/admin/menu/')) return true
  if (pathname === '/admin/staff' || pathname.startsWith('/admin/staff/')) return role === 'super_admin'
  if (pathname === '/admin/orders' || pathname.startsWith('/admin/orders/')) return canManageOrders(role)
  if (pathname === '/admin/products' || pathname.startsWith('/admin/products/')) return canManageCatalog(role)
  if (pathname === '/admin/categories' || pathname.startsWith('/admin/categories/')) return canManageCatalog(role)
  if (pathname === '/admin/settings' || pathname.startsWith('/admin/settings/')) return canManageCatalog(role)
  return pathname === '/admin' && role !== 'waiter'
}
