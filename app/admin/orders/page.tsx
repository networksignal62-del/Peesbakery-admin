'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/lib/types'
import { Search, Filter, RefreshCw, Eye } from 'lucide-react'
import Link from 'next/link'
import styles from './page.module.css'
import toast from 'react-hot-toast'

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#0ea5e9',
  ready: '#22c55e',
  out_for_delivery: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchOrders() {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })

    const { data } = await query
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId: string, status: OrderStatus, note?: string) {
    setUpdatingIds(prev => new Set(prev).add(orderId))
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (!error) {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status,
        note: note || `Status updated to ${status}`,
      })
      toast.success(`Order status updated to "${status.replace('_', ' ')}"`)
    } else {
      toast.error('Failed to update status')
    }
    setUpdatingIds(prev => { const s = new Set(prev); s.delete(orderId); return s })
  }

  const filtered = orders.filter(order => {
    const matchStatus = filterStatus === 'all' || order.status === filterStatus
    const matchSearch = !search ||
      order.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_phone?.includes(search)
    return matchStatus && matchSearch
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Orders</h1>
          <p className={styles.subtitle}>{filtered.length} orders found</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => { setLoading(true); fetchOrders() }}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            placeholder="Search by name, phone, or order #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.statusFilters}>
          <button
            className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.filterActive : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({orders.length})
          </button>
          {STATUS_STEPS.map(status => {
            const count = orders.filter(o => o.status === status).length
            return (
              <button
                key={status}
                className={`${styles.filterBtn} ${filterStatus === status ? styles.filterActive : ''}`}
                onClick={() => setFilterStatus(status)}
                style={filterStatus === status ? { background: STATUS_COLORS[status], borderColor: STATUS_COLORS[status] } : {}}
              >
                {status.replace('_', ' ')} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders */}
      <div className={styles.ordersContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            Loading orders...
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No orders found</p>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderTop}>
                <div className={styles.orderMeta}>
                  <span className={styles.orderNum}>{order.id.substring(0,8).toUpperCase()}</span>
                  <span className={styles.orderDate}>
                    {new Date(order.created_at).toLocaleString('en-SL', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <span
                  className={styles.statusBadge}
                  style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}
                >
                  {order.status.replace('_', ' ')}
                </span>
              </div>

              <div className={styles.orderBody}>
                <div className={styles.customerInfo}>
                  <span className={styles.customerName}>{order.customer_name}</span>
                  {order.customer_phone && (
                    <a href={`https://wa.me/${order.customer_phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      className={styles.whatsapp}
                    >
                      📱 {order.customer_phone}
                    </a>
                  )}
                  <span className={styles.deliveryMethod}>
                    {order.delivery_method === 'delivery' ? '🏠 Delivery' : '🏪 Pickup'}
                    {order.customer_address && ` — ${order.customer_address}`}
                  </span>
                </div>

                <div className={styles.orderRight}>
                  <span className={styles.total}>Le {order.total?.toLocaleString()}</span>
                  <span className={styles.items}>{(order.order_items as any)?.length || 0} items</span>
                </div>
              </div>

              {order.notes && (
                <div className={styles.orderNotes}>💬 {order.notes}</div>
              )}

              <div className={styles.orderActions}>
                <div className={styles.statusUpdate}>
                  <span className={styles.updateLabel}>Update Status:</span>
                  <div className={styles.statusBtns}>
                    {STATUS_STEPS.filter(s => s !== order.status && s !== 'cancelled').map(status => (
                      <button
                        key={status}
                        className={styles.statusBtn}
                        style={{ borderColor: STATUS_COLORS[status], color: STATUS_COLORS[status] }}
                        onClick={() => updateStatus(order.id, status)}
                        disabled={updatingIds.has(order.id)}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        className={`${styles.statusBtn} ${styles.cancelBtn}`}
                        onClick={() => {
                          const reason = prompt('Reason for cancellation?')
                          if (reason !== null) updateStatus(order.id, 'cancelled', reason)
                        }}
                        disabled={updatingIds.has(order.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <Link href={`/admin/orders/${order.id}`} className={styles.viewBtn}>
                  <Eye size={14} /> Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
