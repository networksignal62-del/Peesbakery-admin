import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicKey } from './config'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = getSupabasePublicKey()

  if (!url || !anonKey) {
    if (typeof window === 'undefined') {
      console.warn('Supabase environment variables are missing during build/SSR.')
    }
    return null as unknown as ReturnType<typeof createBrowserClient>
  }

  return createBrowserClient(url, anonKey)
}
