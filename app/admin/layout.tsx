'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminProfile } from '@/lib/types'
import AdminSidebar from '@/components/admin/AdminSidebar'
import styles from './AdminLayout.module.css'
import { Menu, X } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }
    checkAuth()
    setMobileMenuOpen(false) // Close menu on route change
  }, [pathname])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()

    if (!profile) {
      await supabase.auth.signOut()
      router.push('/admin/login')
      setLoading(false)
      return
    }
    setAdmin(profile)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading admin panel...</p>
      </div>
    )
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!admin) {
    return null // Will be redirected to login
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Header overlay */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileTitle}>Pee's Bakery Admin</div>
        <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={`${styles.sidebarWrapper} ${mobileMenuOpen ? styles.sidebarOpen : ''}`}>
        <AdminSidebar admin={admin!} onClose={() => setMobileMenuOpen(false)} />
        {/* Backdrop */}
        {mobileMenuOpen && (
          <div className={styles.sidebarBackdrop} onClick={() => setMobileMenuOpen(false)} />
        )}
      </div>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}
