'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus, OrderItem, OrderStatusHistory } from '@/lib/types'
import { ArrowLeft, Phone, MapPin, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import styles from './page.module.css'

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#3b82f6', preparing: '#0ea5e9',
  ready: '#22c55e', out_for_delivery: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444',
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    params.then(p => fetchOrder(p.id))
  }, [])

  async function fetchOrder(id: string) {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*), order_status_history(*)')
      .eq('id', id)
      .single()
    setOrder(data)
    setLoading(false)
  }

  async function updateStatus(status: OrderStatus) {
    if (!order) return
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
    if (!error) {
      await supabase.from('order_status_history').insert({
        order_id: order.id, status, note: `Status changed to ${status}`,
      })
      setOrder(prev => prev ? { ...prev, status } : null)
      toast.success(`Status updated to "${status.replace('_', ' ')}"`)
    }
    setUpdating(false)
  }

  if (loading) {
    return <div className={styles.loading}><div className={styles.spinner} /></div>
  }

  if (!order) {
    return <div className={styles.loading}><p>Order not found</p></div>
  }

  const items = (order.order_items || []) as OrderItem[]
  const history = (order.order_status_history || []) as OrderStatusHistory[]

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push('/admin/orders')}>
          <ArrowLeft size={18} /> Orders
        </button>
        <div className={styles.headerTitle}>
          <h1>#{order.id.substring(0,8).toUpperCase()}</h1>
          <span
            className={styles.statusBadge}
            style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}
          >
            {order.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.left}>
          {/* Customer Info */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Customer Information</h3>
            <div className={styles.infoGrid}>
              <div><span className={styles.infoLabel}>Name</span><span className={styles.infoValue}>{order.customer_name}</span></div>
              {order.customer_phone && (
                <div>
                  <span className={styles.infoLabel}>Phone</span>
                  <a href={`tel:${order.customer_phone}`} className={styles.infoLink}><Phone size={12} />{order.customer_phone}</a>
                  <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} target="_blank" className={styles.whatsappLink}>WhatsApp</a>
                </div>
              )}
              <div>
                <span className={styles.infoLabel}>Delivery</span>
                <span className={styles.infoValue}>{order.delivery_method === 'delivery' ? '🏠 Delivery' : '🏪 Pickup'}</span>
              </div>
              {order.customer_address && (
                <div className={styles.fullWidth}>
                  <span className={styles.infoLabel}>Address</span>
                  <div className={styles.addressBox}>
                    <MapPin size={14} /> {order.customer_address}
                  </div>
                </div>
              )}
              <div>
                <span className={styles.infoLabel}>Payment</span>
                <span className={styles.infoValue}>{order.payment_method.replace('_', ' ')}</span>
              </div>
              <div>
                <span className={styles.infoLabel}>Date</span>
                <span className={styles.infoValue}>{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>
            {order.notes && (
              <div className={styles.notes}>
                <span className={styles.infoLabel}>Notes</span>
                <p>{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Order Items</h3>
            <div className={styles.itemsList}>
              {items.map(item => (
                <div key={item.id} className={styles.orderItem}>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{item.product_name}</span>
                    {item.variant_name && <span className={styles.itemMeta}>{item.variant_name}</span>}
                    {item.addons && item.addons.length > 0 && (
                      <span className={styles.itemMeta}>+ {item.addons.map((a: any) => a.name).join(', ')}</span>
                    )}
                  </div>
                  <div className={styles.itemQtyPrice}>
                    <span className={styles.itemQty}>×{item.quantity}</span>
                    <span className={styles.itemPrice}>Le {item.total_price?.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.totals}>
              <div className={styles.totalRow}>
                <span>Subtotal</span>
                <span>Le {order.subtotal?.toLocaleString()}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className={styles.totalRow}>
                  <span>Delivery Fee</span>
                  <span>Le {order.delivery_fee?.toLocaleString()}</span>
                </div>
              )}
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Total</span>
                <span>Le {order.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.right}>
          {/* Update Status */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Update Status</h3>
            <div className={styles.statusBtns}>
              {ALL_STATUSES.map(status => (
                <button
                  key={status}
                  className={`${styles.statusBtn} ${order.status === status ? styles.statusCurrent : ''}`}
                  style={order.status === status ? { background: STATUS_COLORS[status], color: 'white', borderColor: STATUS_COLORS[status] } : { borderColor: STATUS_COLORS[status], color: STATUS_COLORS[status] }}
                  onClick={() => order.status !== status && updateStatus(status)}
                  disabled={updating || order.status === status}
                >
                  {updating && <Loader2 size={12} className="animate-spin" />}
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Status History */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Status Timeline</h3>
            <div className={styles.timeline}>
              {history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(h => (
                <div key={h.id} className={styles.timelineItem}>
                  <div
                    className={styles.timelineDot}
                    style={{ background: STATUS_COLORS[h.status] }}
                  />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineStatus}>{h.status.replace('_', ' ')}</span>
                    {h.note && <span className={styles.timelineNote}>{h.note}</span>}
                    <span className={styles.timelineTime}>
                      {new Date(h.created_at).toLocaleString('en-SL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
