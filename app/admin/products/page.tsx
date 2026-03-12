'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Product, Category } from '@/lib/types'
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react'
import Link from 'next/link'
import styles from './page.module.css'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from('products').select('*, product_variants(*), product_addons(*)').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order'),
    ])
    setProducts(productsRes.data || [])
    setCategories(categoriesRes.data || [])
    setLoading(false)
  }

  async function toggleActive(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
      toast.success(`${product.name} ${!product.is_active ? 'activated' : 'deactivated'}`)
    }
  }

  async function toggleFeatured(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ featured: !product.featured })
      .eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, featured: !p.featured } : p))
      toast.success(`${product.name} ${!product.featured ? 'featured' : 'unfeatured'}`)
    }
  }

  async function deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== product.id))
      toast.success(`${product.name} deleted`)
    }
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory === 'all' || p.category === filterCategory
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.is_active : !p.is_active)
    return matchSearch && matchCategory && matchStatus
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products</h1>
          <p className={styles.subtitle}>{filtered.length} products</p>
        </div>
        <Link href="/admin/products/new" className={styles.addBtn}>
          <Plus size={18} /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.select}
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className={styles.select}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className={styles.grid}>
          {[...Array(8)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No products found</p>
          <Link href="/admin/products/new" className={styles.addBtn}>Add your first product</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(product => (
            <div key={product.id} className={`${styles.card} ${!product.is_active ? styles.cardInactive : ''}`}>
              <div className={styles.cardImage}>
                {product.image ? (
                  <img src={product.image.split(',')[0]} alt={product.name} />
                ) : (
                  <div className={styles.imagePlaceholder}>🍞</div>
                )}
                <div className={styles.cardBadges}>
                  {product.featured && (
                    <span className={styles.featuredBadge}>★ Featured</span>
                  )}
                  {!product.is_active && (
                    <span className={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
              </div>

              <div className={styles.cardBody}>
                {product.category && (
                  <span className={styles.category}>{product.category}</span>
                )}
                <h3 className={styles.cardName}>{product.name}</h3>
                {product.description && (
                  <p className={styles.cardDesc}>{product.description}</p>
                )}
                <div className={styles.meta}>
                  {product.product_variants && product.product_variants.length > 0 && (
                    <span>{product.product_variants.length} variants</span>
                  )}
                  {product.product_addons && product.product_addons.length > 0 && (
                    <span>{product.product_addons.length} addons</span>
                  )}
                </div>
                <div className={styles.price}>
                  <span className={styles.priceCurr}>Le</span>
                  <span className={styles.priceNum}>{product.price.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  className={`${styles.actionBtn} ${product.is_active ? styles.activeBtn : styles.inactiveBtn}`}
                  onClick={() => toggleActive(product)}
                  title={product.is_active ? 'Deactivate' : 'Activate'}
                >
                  {product.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  className={`${styles.actionBtn} ${product.featured ? styles.featuredBtn : styles.unfeaturedBtn}`}
                  onClick={() => toggleFeatured(product)}
                  title={product.featured ? 'Unfeature' : 'Feature'}
                >
                  <Star size={16} fill={product.featured ? 'currentColor' : 'none'} />
                </button>
                <Link href={`/admin/products/${product.id}/edit`} className={`${styles.actionBtn} ${styles.editBtn}`}>
                  <Edit size={16} />
                </Link>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => deleteProduct(product)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
