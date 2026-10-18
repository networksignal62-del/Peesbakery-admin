'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './page.module.css'
import Link from 'next/link'

interface SettingField {
  key: string
  label: string
  type: 'text' | 'tel' | 'textarea'
  placeholder: string
}

const SETTING_FIELDS: SettingField[] = [
  { key: 'restaurant_name', label: 'Restaurant Name', type: 'text', placeholder: "Pee's Bakery & Restaurant" },
  { key: 'phone', label: 'General phone number', type: 'tel', placeholder: '+232 78 891638' },
  { key: 'whatsapp', label: 'General WhatsApp', type: 'tel', placeholder: '+232 78 891638' },
  { key: 'checkout_whatsapp', label: 'Checkout WhatsApp', type: 'tel', placeholder: '+232 33 680260' },
  { key: 'order_phone', label: 'Order calls', type: 'tel', placeholder: '+232 75 361494' },
  { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Freetown, Sierra Leone' },
  { key: 'opening_hours', label: 'Opening Hours', type: 'text', placeholder: 'Mon-Sat: 8am - 8pm' },
  { key: 'delivery_fee', label: 'Delivery Fee (Le)', type: 'text', placeholder: '20' },
  { key: 'currency', label: 'Currency Symbol', type: 'text', placeholder: 'Le' },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const { data, error } = await supabase.from('site_settings').select('*')
    if (error) {
      setLoadError('Settings could not be loaded. Check your connection and try again.')
      setLoading(false)
      return
    }
    const map: Record<string, string> = {}
    ;(data || []).forEach((setting: { key: string; value: string | null }) => { map[setting.key] = setting.value || '' })
    setSettings(map)
    setLoadError('')
    setLoading(false)
  }

  async function saveSettings() {
    const deliveryFee = Number(settings.delivery_fee)
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 10000) {
      toast.error('Delivery fee must be a number from 0 to 10,000.')
      return
    }
    const phoneKeys = ['phone', 'whatsapp', 'checkout_whatsapp', 'order_phone']
    if (phoneKeys.some(key => {
      const length = (settings[key] || '').replace(/\D/g, '').length
      return length < 8 || length > 15
    })) {
      toast.error('Enter a valid number for each phone and WhatsApp purpose.')
      return
    }
    setSaving(true)
    try {
      const keys = [...SETTING_FIELDS.map(field => field.key), 'is_open']
      const updates = Object.fromEntries(keys.filter(key => settings[key] !== undefined).map(key => [key, settings[key]]))
      const { error } = await supabase.rpc('save_public_settings', { p_settings: updates })
      if (error) throw error
      toast.success('Settings saved. Customers will see changes after refreshing.')
    } catch {
      toast.error('Settings could not be saved. Please try again.')
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

  if (loadError) {
    return <div className={styles.loading}><p role="alert">{loadError}</p><button type="button" onClick={() => { setLoading(true); void fetchSettings() }}>Try again</button></div>
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
                <label htmlFor={`setting-${field.key}`}>{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`setting-${field.key}`}
                    placeholder={field.placeholder}
                    value={settings[field.key] || ''}
                    onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <input
                    id={`setting-${field.key}`}
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
          <div className={styles.toggle}>
            <div>
              <span className={styles.toggleLabel}>Restaurant is Open</span>
              <span className={styles.toggleDesc}>
                {settings['is_open'] === 'true' ? 'Currently accepting orders' : 'Not accepting orders'}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings['is_open'] === 'true'}
              aria-label="Restaurant is open"
              className={`${styles.toggleSwitch} ${settings['is_open'] === 'true' ? styles.toggleOn : ''}`}
              onClick={() => setSettings(s => ({ ...s, is_open: s.is_open === 'true' ? 'false' : 'true' }))}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Access and security</h3>
          <p className={styles.note}>Use <Link href="/admin/account">My account</Link> to change your password. Owners can <Link href="/admin/staff">invite staff and assign roles</Link>.</p>
        </div>
      </div>
    </div>
  )
}
