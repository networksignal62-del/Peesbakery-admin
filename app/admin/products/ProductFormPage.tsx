'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Minus, Loader2, Upload, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './ProductForm.module.css'

interface Props {
  params: Promise<{ id: string }>
  isNew?: boolean
}

export default function ProductFormPage({ params: paramsPromise, isNew = false }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    long_description: '',
    featured: false,
    is_active: true,
    is_customizable: false,
  })
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<{ name: string; price: string; description: string }[]>([])
  const [addons, setAddons] = useState<{ name: string; price: string }[]>([])
  const [productId, setProductId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
    if (!isNew) {
      paramsPromise.then(p => {
        setProductId(p.id)
        fetchProduct(p.id)
      })
    }
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('display_order')
    setCategories(data || [])
  }

  async function fetchProduct(id: string) {
    const { data } = await supabase
      .from('products')
      .select('*, product_variants(*), product_addons(*)')
      .eq('id', id)
      .single()

    if (data) {
      setForm({
        name: data.name,
        category: data.category || '',
        price: data.price.toString(),
        description: data.description || '',
        long_description: data.long_description || '',
        featured: data.featured || false,
        is_active: data.is_active,
        is_customizable: data.is_customizable,
      })
      setImages(data.image ? data.image.split(',') : [])
      setVariants((data.product_variants || []).map((v: { name: string; price: number; description: string | null }) => ({
        name: v.name, price: v.price.toString(), description: v.description || ''
      })))
      setAddons((data.product_addons || []).map((a: { name: string; price: number }) => ({
        name: a.name, price: a.price.toString()
      })))
    }
    setLoading(false)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImage(true)
    const formData = new FormData()
    Array.from(files).forEach((file) => {
      formData.append('images', file)
    })

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setImages(prev => [...prev, ...data.urls])
      toast.success(`${data.urls.length} image(s) uploaded!`)
    } catch (err: unknown) {
      toast.error('Upload failed: ' + (err instanceof Error ? err.message : 'Please try again.'))
    } finally {
      setUploadingImage(false)
      // Reset input
      e.target.value = ''
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    const price = Number(form.price)
    if (!form.name.trim() || !form.category || !Number.isFinite(price) || price < 0 || price > 1000000 ||
        variants.some(item => !item.name.trim() || !Number.isFinite(Number(item.price)) || Number(item.price) < 0 || Number(item.price) > 1000000) ||
        addons.some(item => !item.name.trim() || !Number.isFinite(Number(item.price)) || Number(item.price) < 0 || Number(item.price) > 1000000)) {
      toast.error('Enter a name, category, and valid non-negative prices.')
      return
    }
    setSaving(true)

    try {
      const productData = {
        name: form.name.trim(),
        category: form.category,
        price,
        description: form.description || null,
        long_description: form.long_description || null,
        featured: form.featured,
        is_active: form.is_active,
        is_customizable: form.is_customizable,
        image: images.length > 0 ? images.join(',') : null,
      }

      if (!isNew && (!productId || !Number.isSafeInteger(Number(productId)))) throw new Error('Product ID is invalid.')
      const { data: savedId, error: saveError } = await supabase.rpc('save_catalog_product', {
        p_product_id: isNew ? null : Number(productId),
        p_product: productData,
        p_variants: variants.map(variant => ({ name: variant.name.trim(), price: Number(variant.price), description: variant.description || null })),
        p_addons: addons.map(addon => ({ name: addon.name.trim(), price: Number(addon.price) })),
      })
      if (saveError || !savedId) throw saveError || new Error('Product could not be saved.')

      toast.success(`Product ${isNew ? 'created' : 'updated'} successfully!`)
      router.push('/admin/products')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Loading product...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/admin/products')}>
          <ArrowLeft size={18} /> Products
        </button>
        <h1 className={styles.title}>{isNew ? 'Add New Product' : 'Edit Product'}</h1>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Product'}
        </button>
      </div>

      <div className={styles.content}>
        {/* Main Form */}
        <div className={styles.mainForm}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Basic Information</h3>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label htmlFor="product-name">Product Name *</label>
                <input
                  id="product-name"
                  type="text"
                  placeholder="e.g. Fresh Bread Loaf"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <label htmlFor="product-category">Category *</label>
                  <select
                    id="product-category"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Choose a category</option>
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label htmlFor="product-price">Base Price (Le) *</label>
                  <input
                    id="product-price"
                    type="number"
                    placeholder="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="product-description">Short Description</label>
                <textarea
                  id="product-description"
                  placeholder="Brief description for the menu card..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="product-long-description">Long Description (Optional)</label>
                <textarea
                  id="product-long-description"
                  placeholder="Detailed description shown in product details..."
                  value={form.long_description}
                  onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Product Images</h3>
              <span className={styles.imageCount}>{images.length} images</span>
            </div>
            
            <div className={styles.imageActions}>
              <label className={styles.uploadBtn}>
                {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploadingImage ? 'Uploading...' : 'Upload Multiple'}
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple
                  onChange={handleImageUpload} 
                  style={{ display: 'none' }} 
                  disabled={uploadingImage}
                />
              </label>

            </div>

            {images.length > 0 && (
              <div className={styles.galleryGrid}>
                {images.map((img, i) => (
                  <div key={i} className={styles.galleryItem}>
                    <img src={img} alt={`Product ${i+1}`} />
                    <button 
                      className={styles.removeImageBtn} 
                      onClick={() => removeImage(i)}
                      title="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.field} style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <label>Or enter Image URL manually to append</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  id="manualImageUrl"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = (e.currentTarget as HTMLInputElement).value
                      if (val) {
                        setImages(prev => [...prev, val])
                        e.currentTarget.value = ''
                      }
                    }
                  }}
                />
                <button type="button" className={styles.addItemBtn} onClick={() => {
                  const input = document.getElementById('manualImageUrl') as HTMLInputElement
                  if(input.value) {
                    setImages(prev => [...prev, input.value])
                    input.value = ''
                  }
                }}>Add</button>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Sizes / Variants</h3>
              <button
                className={styles.addItemBtn}
                onClick={() => setVariants(v => [...v, { name: '', price: '', description: '' }])}
              >
                <Plus size={14} /> Add Variant
              </button>
            </div>
            {variants.length === 0 ? (
              <p className={styles.emptyHint}>No variants added. Click &quot;Add Variant&quot; to add sizes or types.</p>
            ) : (
              <div className={styles.itemList}>
                {variants.map((v, i) => (
                  <div key={i} className={styles.item}>
                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label>Name</label>
                        <input
                          placeholder="e.g. Small"
                          value={v.name}
                          onChange={e => setVariants(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Price (Le)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={v.price}
                          onChange={e => setVariants(prev => prev.map((item, idx) => idx === i ? { ...item, price: e.target.value } : item))}
                          min="0"
                        />
                      </div>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Addons */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Add-ons / Extras</h3>
              <button
                className={styles.addItemBtn}
                onClick={() => setAddons(a => [...a, { name: '', price: '' }])}
              >
                <Plus size={14} /> Add Extra
              </button>
            </div>
            {addons.length === 0 ? (
              <p className={styles.emptyHint}>No add-ons. Click &quot;Add Extra&quot; to add optional extras.</p>
            ) : (
              <div className={styles.itemList}>
                {addons.map((a, i) => (
                  <div key={i} className={styles.item}>
                    <div className={styles.grid2}>
                      <div className={styles.field}>
                        <label>Name</label>
                        <input
                          placeholder="e.g. Extra butter"
                          value={a.name}
                          onChange={e => setAddons(prev => prev.map((item, idx) => idx === i ? { ...item, name: e.target.value } : item))}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>Price (Le)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={a.price}
                          onChange={e => setAddons(prev => prev.map((item, idx) => idx === i ? { ...item, price: e.target.value } : item))}
                          min="0"
                        />
                      </div>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => setAddons(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Settings</h3>
            <div className={styles.toggles}>
              <label className={styles.toggle}>
                <div>
                  <span className={styles.toggleLabel}>Active</span>
                  <span className={styles.toggleDesc}>Visible to customers</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className={styles.toggleInput}
                />
                <span className={`${styles.toggleSwitch} ${form.is_active ? styles.toggleOn : ''}`} />
              </label>
              <label className={styles.toggle}>
                <div>
                  <span className={styles.toggleLabel}>Featured</span>
                  <span className={styles.toggleDesc}>Show in featured section</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                  className={styles.toggleInput}
                />
                <span className={`${styles.toggleSwitch} ${form.featured ? styles.toggleOn : ''}`} />
              </label>
              <label className={styles.toggle}>
                <div>
                  <span className={styles.toggleLabel}>Customizable</span>
                  <span className={styles.toggleDesc}>Custom cake/item</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_customizable}
                  onChange={e => setForm(f => ({ ...f, is_customizable: e.target.checked }))}
                  className={styles.toggleInput}
                />
                <span className={`${styles.toggleSwitch} ${form.is_customizable ? styles.toggleOn : ''}`} />
              </label>
            </div>
          </div>

          {/* Preview Card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Customer Preview</h3>
            <div className={styles.previewCard}>
              <div className={styles.previewImage}>
                {images.length > 0 ? (
                  <img src={images[0]} alt="Preview" />
                ) : (
                  <span>🍞</span>
                )}
              </div>
              <div className={styles.previewBody}>
                <span className={styles.previewCategory}>
                  {form.category || 'No category'}
                </span>
                <h4 className={styles.previewName}>{form.name || 'Product Name'}</h4>
                <p className={styles.previewDesc}>{form.description || 'Product description...'}</p>
                <div className={styles.previewFooter}>
                  <span className={styles.previewPrice}>
                    Le {form.price ? parseFloat(form.price).toLocaleString() : '0'}
                  </span>
                  <span className={styles.previewBtn}>Add</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
