'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import styles from './page.module.css'

export default function AccountPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function changePassword(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword.length < 12) return setError('Use at least 12 characters for the new password.')
    if (newPassword !== confirmPassword) return setError('The new passwords do not match.')
    if (newPassword === currentPassword) return setError('Choose a new password different from your current one.')

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user?.email) throw new Error('Your session expired. Sign in again.')

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (verifyError) throw new Error('The current password is incorrect.')

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw new Error(updateError.message || 'The password could not be changed.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      await supabase.auth.signOut()
      toast.success('Password changed. Sign in with your new password.')
      router.replace('/admin/login')
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The password could not be changed.')
    } finally {
      setSaving(false)
    }
  }

  return <section className={styles.page}>
    <h1>My account</h1>
    <p>Change your password while signed in. You will sign in again after it changes.</p>
    <form className={styles.card} onSubmit={changePassword}>
      <h2>Change password</h2>
      <label>Current password<input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></label>
      <label>New password<input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></label>
      <label>Confirm new password<input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button disabled={saving} type="submit">{saving ? 'Changing password…' : 'Change password'}</button>
    </form>
  </section>
}
