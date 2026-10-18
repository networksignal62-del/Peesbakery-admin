import Link from 'next/link'
export default function NotFound() {
  return <div style={{ padding: '2rem' }}><h1>Page not found</h1><p>This staff page does not exist.</p><Link href="/admin">Go to dashboard</Link></div>
}
