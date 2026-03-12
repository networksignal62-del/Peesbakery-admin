'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './page.module.css'

interface SettingField {
  key: string
  label: string
  type: 'text' | 'tel' | 'textarea'
  placeholder: string
}

const SETTING_FIELDS: SettingField[] = [
  { key: 'restaurant_name', label: 'Restaurant Name', type: 'text', placeholder: "Pee's Bakery & Restaurant" },
  { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+232 78 891638' },
  { key: 'whatsapp', label: 'WhatsApp Number', type: 'tel', placeholder: '+23278891638' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Freetown, Sierra Leone' },
  { key: 'opening_hours', label: 'Opening Hours', type: 'text', placeholder: 'Mon-Sat: 8am - 8pm' },
  { key: 'delivery_fee', label: 'Delivery Fee (Le)', type: 'text', placeholder: '5000' },
  { key: 'currency_symbol', label: 'Currency Symbol', type: 'text', placeholder: 'Le' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data } = await supabase.from('site_settings').select('*')
    const map: Record<string, string> = {}
    ;(data || []).forEach((s: any) => { map[s.key] = s.value || '' })
    setSettings(map)
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) =>
        supabase.from('site_settings').upsert({ key, value }, { onConflict: 'key' })
      )
      await Promise.all(updates)
      toast.success('Settings saved! Changes are live for customers.')
    } catch (err) {
      toast.error('Failed to save settings')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Manage your restaurant configuration</p>
        </div>
        <button className={styles.saveBtn} onClick={saveSettings} disabled={saving}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div className={styles.sections}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Restaurant Information</h3>
          <div className={styles.fields}>
            {SETTING_FIELDS.map(field => (
              <div key={field.key} className={styles.field}>
                <label>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    value={settings[field.key] || ''}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={settings[field.key] || ''}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Restaurant Status</h3>
          <label className={styles.toggle}>
            <div>
              <span className={styles.toggleLabel}>Restaurant is Open</span>
              <span className={styles.toggleDesc}>
                {settings['is_open'] === 'true' ? 'Currently accepting orders' : 'Not accepting orders'}
              </span>
            </div>
            <div
              className={`${styles.toggleSwitch} ${settings['is_open'] === 'true' ? styles.toggleOn : ''}`}
              onClick={() => setSettings(s => ({ ...s, is_open: s.is_open === 'true' ? 'false' : 'true' }))}
            />
          </label>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>How to Set Up Admin Account</h3>
          <ol className={styles.setupSteps}>
            <li>Go to your Supabase project &rarr; <strong>Authentication &rarr; Users &rarr; Add User</strong></li>
            <li>Enter the admin email and password. Copy the new user's UUID.</li>
            <li>Run this SQL in the Supabase SQL Editor:</li>
          </ol>
          <pre className={styles.codeBlock}>{`INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
VALUES (
  '<paste-user-uuid>',
  'admin@peesbakery.com',
  'Pee',
  'super_admin',
  true
);`}</pre>
          <p className={styles.note}>Then visit <code>/admin/login</code> to sign in.</p>
        </div>
      </div>
    </div>
  )
}
