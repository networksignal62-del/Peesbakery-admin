'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './page.module.css'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', data.user.id)
        .eq('is_active', true)
        .single()

      if (!adminProfile) {
        await supabase.auth.signOut()
        toast.error('Access denied. Admin account required.')
        setLoading(false)
        return
      }

      toast.success(`Welcome back, ${adminProfile.full_name || 'Admin'}!`)
      router.push('/admin')
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <ChefHat size={32} color="white" />
          </div>
          <h1 className={styles.logoText}>Pee's Bakery</h1>
          <p className={styles.logoSub}>Admin Panel</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.title}>Sign In</h2>
          <p className={styles.subtitle}>Sign in to manage your bakery</p>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="admin@peesbakery.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(s => !s)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Signing in...</>
              ) : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>

        <p className={styles.footer}>Pee's Bakery & Restaurant — Freetown, Sierra Leone</p>
      </div>
    </div>
  )
}
