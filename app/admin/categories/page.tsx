'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './page.module.css'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('display_order')
    setCategories(data || [])
    setLoading(false)
  }

  async function addCategory() {
    if (!newCategoryName.trim()) return
    setAdding(true)
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: newCategoryName.trim(),
        display_order: categories.length + 1,
        is_active: true,
      })
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => [...prev, data])
      setNewCategoryName('')
      toast.success(`Category "${data.name}" created!`)
    } else {
      toast.error('Failed to create category')
    }
    setAdding(false)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    const { error } = await supabase
      .from('categories')
      .update({ name: editName.trim() })
      .eq('id', id)

    if (!error) {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c))
      toast.success('Category updated!')
    }
    setEditingId(null)
  }

  async function toggleActive(cat: Category) {
    const { error } = await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    if (!error) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      toast.success(`"${cat.name}" ${!cat.is_active ? 'activated' : 'deactivated'}`)
    }
  }

  async function deleteCategory(cat: Category) {
    if (!confirm(`Delete "${cat.name}"? Products in this category will be uncategorized.`)) return
    const { error } = await supabase.from('categories').delete().eq('id', cat.id)
    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      toast.success(`"${cat.name}" deleted`)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Categories</h1>
          <p className={styles.subtitle}>Manage your food categories</p>
        </div>
      </div>

      {/* Add Category */}
      <div className={styles.addSection}>
        <h3>Add New Category</h3>
        <div className={styles.addRow}>
          <input
            type="text"
            placeholder="Category name (e.g. Pastries, Cakes, Drinks...)"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
            className={styles.addInput}
          />
          <button className={styles.addBtn} onClick={addCategory} disabled={adding || !newCategoryName.trim()}>
            {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add Category
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className={styles.list}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className={styles.empty}>
            <p>No categories yet. Add your first category above.</p>
          </div>
        ) : (
          categories.map((cat, index) => (
            <div key={cat.id} className={`${styles.item} ${!cat.is_active ? styles.itemInactive : ''}`}>
              <div className={styles.itemLeft}>
                <span className={styles.itemNum}>{index + 1}</span>
                {editingId === cat.id ? (
                  <div className={styles.editRow}>
                    <input
                      className={styles.editInput}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(cat.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      autoFocus
                    />
                    <button className={styles.confirmBtn} onClick={() => saveEdit(cat.id)}>
                      <Check size={14} />
                    </button>
                    <button className={styles.cancelEditBtn} onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className={styles.itemName}>{cat.name}</span>
                  </div>
                )}
              </div>

              <div className={styles.itemRight}>
                <span className={`${styles.statusBadge} ${cat.is_active ? styles.activeBadge : styles.inactiveBadge}`}>
                  {cat.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  className={styles.actionBtn}
                  onClick={() => toggleActive(cat)}
                  title={cat.is_active ? 'Deactivate' : 'Activate'}
                >
                  {cat.is_active ? <ToggleRight size={18} color="var(--success)" /> : <ToggleLeft size={18} />}
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => { setEditingId(cat.id); setEditName(cat.name) }}
                  title="Edit"
                >
                  <Edit2 size={16} color="var(--info)" />
                </button>
                <button
                  className={styles.actionBtn}
                  onClick={() => deleteCategory(cat)}
                  title="Delete"
                >
                  <Trash2 size={16} color="var(--error)" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
