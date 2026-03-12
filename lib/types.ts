export interface AdminProfile {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  delivery_method: string
  payment_method: string
  payment_proof_url: string
  subtotal: number
  delivery_fee: number
  total: number
  status: OrderStatus
  notes: string
  created_at: string
  updated_at: string
  
  order_items?: OrderItem[]
  order_status_history?: OrderStatusHistory[]
}

export interface OrderItem {
  id: number
  order_id: string
  product_id: number
  product_name: string
  variant_name: string
  quantity: number
  unit_price: number
  total_price: number
  addons: any
  special_instructions: string
  created_at: string
}

export interface OrderStatusHistory {
  id: number
  order_id: string
  status: OrderStatus
  note: string | null
  created_at: string
}

export interface Product {
  id: number
  name: string
  category: string
  price: number
  image: string
  description: string
  long_description: string
  featured: boolean
  rating: number
  review_count: number
  is_customizable: boolean
  is_active: boolean
  created_at: string
  updated_at: string

  product_variants?: ProductVariant[]
  product_addons?: ProductAddon[]
  categories?: Category
}

export interface ProductVariant {
  id: number
  product_id: number
  name: string
  price: number
  description: string
  created_at: string
}

export interface ProductAddon {
  id: number
  product_id: number
  name: string
  price: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  display_order: number
  is_active: boolean
  created_at: string
}
