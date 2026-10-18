'use client'
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div role="alert" style={{ padding: '2rem' }}><h1>Something went wrong</h1><p>The staff panel could not load this page.</p><button type="button" onClick={reset}>Try again</button></div>
}
