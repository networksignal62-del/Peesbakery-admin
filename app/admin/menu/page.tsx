'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

type MenuOption = { name: string; price: number }
type MenuItem = {
  id: number
  name: string
  category: string
  price: number
  description: string | null
  image: string | null
  product_variants: MenuOption[]
  product_addons: MenuOption[]
}
const menuUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://peesbakery.rest'}/menu`

export default function StaffMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error: loadError } = await createClient()
      .from('products')
      .select('id, name, category, price, description, image, product_variants(name, price), product_addons(name, price)')
      .eq('is_active', true)
      .order('name')
    if (loadError) setError('The menu could not be loaded. Try again.')
    else { setItems(data ?? []); setError('') }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const categories = useMemo(() => ['all', ...new Set(items.map(item => item.category))], [items])
  const visible = useMemo(() => items.filter(item =>
    (category === 'all' || item.category === category) &&
    `${item.name} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase().trim()),
  ), [items, category, query])

  async function shareMenu() {
    try {
      if (navigator.share) await navigator.share({ title: "Pee's Bakery menu", url: menuUrl })
      else { await navigator.clipboard.writeText(menuUrl); setMessage('Menu link copied.') }
    } catch { setMessage('Open the menu link below to show it to your customer.') }
  }

  return <section className={styles.page}>
    <header className={styles.header}>
      <div><h1>Digital menu</h1><p>Show this menu to customers in person. Only available products appear here.</p></div>
      <div className={styles.actions}>
        <button type="button" onClick={shareMenu}>Share menu</button>
        <a href={menuUrl} target="_blank" rel="noopener noreferrer">Open customer menu</a>
      </div>
    </header>
    {message && <p role="status" className={styles.message}>{message}</p>}
    <p className={styles.link}>Customer link: <a href={menuUrl} target="_blank" rel="noopener noreferrer">{menuUrl}</a></p>
    <div className={styles.filters}>
      <label>Find a dish<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the menu" /></label>
      <label>Category<select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(value => <option key={value} value={value}>{value === 'all' ? 'All categories' : value}</option>)}</select></label>
      <button type="button" onClick={load} disabled={loading}>Refresh</button>
    </div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {loading ? <p role="status">Loading the menu…</p> : visible.length === 0 ? <p className={styles.empty}>{items.length ? 'No dishes match your search.' : 'No products are available yet. Ask a manager to add or enable products.'}</p> : (
      <div className={styles.grid}>{visible.map(item => {
        const imageUrl = item.image?.split(',')[0]?.trim()
        return <article className={styles.card} key={item.id}>
          {imageUrl && <div className={styles.image}><Image src={imageUrl} alt={item.name} fill sizes="(max-width: 640px) 45vw, 230px" unoptimized /></div>}
          <div className={styles.details}>
            <span className={styles.category}>{item.category.replaceAll('-', ' ')}</span>
            <h2>{item.name}</h2>
            {item.description && <p>{item.description}</p>}
            <strong>Base: Le {Number(item.price).toLocaleString()}</strong>
            {!!item.product_variants?.length && <div className={styles.options}><span>Sizes and options</span>{item.product_variants.map(option => <div key={option.name}>{option.name} · Le {Number(option.price).toLocaleString()}</div>)}</div>}
            {!!item.product_addons?.length && <div className={styles.options}><span>Add-ons</span>{item.product_addons.map(option => <div key={option.name}>{option.name} · +Le {Number(option.price).toLocaleString()}</div>)}</div>}
          </div>
        </article>
      })}</div>
    )}
  </section>
}
