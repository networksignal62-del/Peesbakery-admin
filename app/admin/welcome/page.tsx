'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isStaffRole } from '@/lib/admin-access'
import styles from '../account/page.module.css'

export default function WelcomePage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function acceptInvitation() {
      try {
        const supabase = createClient()
        const fragment = new URLSearchParams(window.location.hash.slice(1))
        const accessToken = fragment.get('access_token')
        const refreshToken = fragment.get('refresh_token')
        if (fragment.get('type') === 'invite' && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          if (sessionError) throw sessionError
          window.history.replaceState(null, '', window.location.pathname)
        }
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('This invitation is invalid or has expired. Ask the owner for a new invitation.')
        const { data: profile } = await supabase.from('admin_profiles').select('role, is_active').eq('id', user.id).maybeSingle()
        if (!profile?.is_active || !isStaffRole(profile.role)) throw new Error('This invitation does not have active staff access.')
        if (active) setReady(true)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not accept this invitation.')
      }
    }
    void acceptInvitation()
    return () => { active = false }
  }, [])

  async function choosePassword(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 12) return setError('Use at least 12 characters.')
    if (password !== confirmation) return setError('The passwords do not match.')
    setSaving(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      router.replace('/admin/login')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not set your password.')
    } finally {
      setSaving(false)
    }
  }

  return <section className={styles.page}>
    <h1>Welcome to Pee&apos;s Bakery</h1>
    <p>Accept your staff invitation and choose a password to sign in.</p>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {!ready && !error && <p role="status">Checking your invitation…</p>}
    {ready && <form className={styles.card} onSubmit={choosePassword}>
      <h2>Choose a password</h2>
      <label>New password<input type="password" minLength={12} required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label>Confirm password<input type="password" minLength={12} required autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Set password'}</button>
    </form>}
    <p><Link href="/admin/login">Back to staff sign in</Link></p>
  </section>
}
