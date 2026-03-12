'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AdminProfile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ShoppingBag, Package, Tags, Settings, LogOut, ChefHat, Bell
} from 'lucide-react'
import { useState, useEffect } from 'react'
import styles from './AdminSidebar.module.css'
import toast from 'react-hot-toast'

interface Props {
  admin: AdminProfile
  onClose?: () => void
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminSidebar({ admin, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetchPendingCount()
    const channel = supabase
      .channel('pending-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPendingCount()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    setPendingCount(count || 0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    router.push('/admin/login')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <ChefHat size={22} color="white" />
        </div>
        <div>
          <h1 className={styles.logoName}>Pee's Bakery</h1>
          <p className={styles.logoSub}>Admin Panel</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`${styles.navItem} ${isActive ? styles.navActive : ''}`}
              onClick={() => onClose && onClose()}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Orders' && pendingCount > 0 && (
                <span className={styles.navBadge}>{pendingCount}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.adminCard}>
          <div className={styles.adminAvatar}>
            {admin.full_name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
          </div>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>{admin.full_name || 'Admin'}</span>
            <span className={styles.adminRole}>{admin.role.replace('_', ' ')}</span>
          </div>
        </div>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
