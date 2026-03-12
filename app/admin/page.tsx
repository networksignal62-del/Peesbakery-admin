'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order } from '@/lib/types'
import { ShoppingBag, DollarSign, Clock, Package, TrendingUp, Bell } from 'lucide-react'
import Link from 'next/link'
import styles from './page.module.css'
import toast from 'react-hot-toast'

interface Stats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  totalProducts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, todayRevenue: 0, pendingOrders: 0, totalProducts: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
    setupRealtime()
  }, [])

  async function fetchData() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const [todayOrdersRes, pendingRes, productsRes, recentRes] = await Promise.all([
      supabase.from('orders').select('total').gte('created_at', todayStr).neq('status', 'cancelled'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(10),
    ])

    const todayRevenue = (todayOrdersRes.data || []).reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    setStats({
      todayOrders: todayOrdersRes.data?.length || 0,
      todayRevenue,
      pendingOrders: pendingRes.count || 0,
      totalProducts: productsRes.count || 0,
    })
    setRecentOrders(recentRes.data || [])
    setLoading(false)
  }

  function setupRealtime() {
    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const order = payload.new as Order
        toast(`🛒 New Order! #${order.id.substring(0,8).toUpperCase()} — ${order.customer_name}`, {
          duration: 8000,
          style: { background: '#f97316', color: 'white', fontWeight: '700' },
        })
        fetchData()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, () => {
        fetchData()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    preparing: '#0ea5e9',
    ready: '#22c55e',
    out_for_delivery: '#8b5cf6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Welcome back! Here's what's happening today.</p>
        </div>
        <Link href="/admin/orders" className={styles.viewAllBtn}>
          View All Orders
        </Link>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          icon={<ShoppingBag size={22} />}
          title="Today's Orders"
          value={loading ? '...' : stats.todayOrders}
          color="#f97316"
          bg="#fff7ed"
        />
        <StatCard
          icon={<DollarSign size={22} />}
          title="Today's Revenue"
          value={loading ? '...' : `Le ${stats.todayRevenue.toLocaleString()}`}
          color="#166534"
          bg="#f0fdf4"
        />
        <StatCard
          icon={<Clock size={22} />}
          title="Pending Orders"
          value={loading ? '...' : stats.pendingOrders}
          color="#f59e0b"
          bg="#fffbeb"
          alert={stats.pendingOrders > 0}
        />
        <StatCard
          icon={<Package size={22} />}
          title="Active Products"
          value={loading ? '...' : stats.totalProducts}
          color="#3b82f6"
          bg="#eff6ff"
        />
      </div>

      {/* Recent Orders */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Orders</h2>
          <Link href="/admin/orders">View all →</Link>
        </div>
        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j}><div className={styles.skeletonCell} /></td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.empty}>No orders yet</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className={styles.orderNum}>{order.id.substring(0,8).toUpperCase()}</td>
                    <td>
                      <div className={styles.customerName}>{order.customer_name}</div>
                      <div className={styles.customerPhone}>{order.customer_phone}</div>
                    </td>
                    <td>{(order.order_items as any)?.length || 0} items</td>
                    <td className={styles.amount}>Le {order.total?.toLocaleString()}</td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{ background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.date}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className={styles.viewBtn}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link href="/admin/products/new" className={styles.action}>
            <Package size={24} />
            <span>Add New Product</span>
          </Link>
          <Link href="/admin/categories" className={styles.action}>
            <TrendingUp size={24} />
            <span>Manage Categories</span>
          </Link>
          <Link href="/admin/orders" className={styles.action}>
            <Bell size={24} />
            <span>View Orders</span>
          </Link>
          <Link href="/admin/settings" className={styles.action}>
            <Package size={24} />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, color, bg, alert }: {
  icon: React.ReactNode; title: string; value: string | number; color: string; bg: string; alert?: boolean
}) {
  return (
    <div className={styles.statCard} style={{ borderColor: color + '30' }}>
      <div className={styles.statIcon} style={{ background: bg, color }}>
        {icon}
        {alert && <span className={styles.alertDot} />}
      </div>
      <div className={styles.statBody}>
        <span className={styles.statTitle}>{title}</span>
        <span className={styles.statValue}>{value}</span>
      </div>
    </div>
  )
}
