'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy } from 'lucide-react'

export default function DuplicateTripButton({ tripId }: { tripId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDuplicate() {
    setLoading(true)
    const res = await fetch(`/api/trips/${tripId}/duplicate`, { method: 'POST' })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/dashboard/trips/${id}`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button onClick={handleDuplicate} disabled={loading}
      className="hover-bg px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
>
      <Copy className="w-3 h-3" />
      {loading ? 'Copying…' : 'Duplicate'}
    </button>
  )
}
