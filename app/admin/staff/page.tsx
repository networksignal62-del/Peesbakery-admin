'use client'

import { useCallback, useEffect, useState } from 'react'
import { STAFF_ROLES, type StaffRole } from '@/lib/admin-access'
import styles from './page.module.css'

type StaffMember = {
  id: string
  email: string
  full_name: string
  role: StaffRole
  is_active: boolean
  created_at: string
}

const ROLE_LABELS: Record<StaffRole, string> = {
  super_admin: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  waiter: 'Waiter',
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [drafts, setDrafts] = useState<Record<string, StaffMember>>({})
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<StaffRole>('waiter')

  const loadStaff = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/staff', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load staff accounts.')
      setStaff(result.staff)
      setDrafts(Object.fromEntries(result.staff.map((person: StaffMember) => [person.id, person])))
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load staff accounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadStaff() }, [loadStaff])

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    setSavingId('invite')
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, role }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not send invitation.')
      setMessage(`Invitation sent to ${email}.`)
      setEmail('')
      setFullName('')
      setRole('waiter')
      await loadStaff()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send invitation.')
    } finally {
      setSavingId(null)
    }
  }

  async function save(person: StaffMember) {
    setSavingId(person.id)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/staff/${person.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: person.full_name, role: person.role, is_active: person.is_active }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save this account.')
      setMessage(`${person.full_name}'s account was updated.`)
      await loadStaff()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this account.')
    } finally {
      setSavingId(null)
    }
  }

  function change(id: string, patch: Partial<StaffMember>) {
    setDrafts(current => ({ ...current, [id]: { ...current[id], ...patch } }))
  }

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1>Staff access</h1>
        <p>Invite employees and give each person only the access their job needs.</p>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {message && <p className={styles.success} role="status">{message}</p>}

      <form className={styles.card} onSubmit={invite}>
        <h2>Invite a staff member</h2>
        <p>The employee receives an email invitation and chooses their own password.</p>
        <div className={styles.formGrid}>
          <label>Full name<input value={fullName} onChange={event => setFullName(event.target.value)} minLength={2} maxLength={80} required autoComplete="name" /></label>
          <label>Email address<input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" /></label>
          <label>Role<select value={role} onChange={event => setRole(event.target.value as StaffRole)}>{STAFF_ROLES.map(item => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label>
        </div>
        <p className={styles.hint}>Waiters can show the digital menu. Staff can also handle orders. Managers and admins can manage the catalogue and settings. Only owners can manage accounts.</p>
        <button type="submit" disabled={savingId !== null}>{savingId === 'invite' ? 'Sending invitation…' : 'Send invitation'}</button>
      </form>

      <div className={styles.listHeader}><h2>Team members</h2><span>{staff.length} account{staff.length === 1 ? '' : 's'}</span></div>
      {loading ? <p role="status">Loading staff accounts…</p> : staff.length === 0 ? <p className={styles.card}>No staff accounts yet. Invite the first employee above.</p> : (
        <div className={styles.list}>
          {staff.map(person => {
            const draft = drafts[person.id] || person
            const changed = draft.full_name !== person.full_name || draft.role !== person.role || draft.is_active !== person.is_active
            return <div className={styles.card} key={person.id}>
              <div className={styles.memberHeader}><strong>{person.email}</strong><span className={person.is_active ? styles.active : styles.inactive}>{person.is_active ? 'Active' : 'Disabled'}</span></div>
              <div className={styles.formGrid}>
                <label>Full name<input value={draft.full_name || ''} onChange={event => change(person.id, { full_name: event.target.value })} minLength={2} maxLength={80} /></label>
                <label>Role<select value={draft.role} onChange={event => change(person.id, { role: event.target.value as StaffRole })}>{STAFF_ROLES.map(item => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label>
                <label>Status<select value={draft.is_active ? 'active' : 'disabled'} onChange={event => change(person.id, { is_active: event.target.value === 'active' })}><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
              </div>
              <button type="button" disabled={!changed || savingId !== null} onClick={() => save(draft)}>{savingId === person.id ? 'Saving…' : 'Save changes'}</button>
            </div>
          })}
        </div>
      )}
    </section>
  )
}
