import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables are missing during build/SSR.')
    }
    return null as any
  }

  return createBrowserClient(url, anonKey)
}
