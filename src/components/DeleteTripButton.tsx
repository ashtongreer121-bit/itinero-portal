'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export default function DeleteTripButton({ tripId }: { tripId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={handleDelete} disabled={loading}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: 'var(--danger)' }}>
          {loading ? '…' : 'Delete'}
        </button>
        <button onClick={() => setConfirming(false)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)}
      className="hover-danger p-1.5 rounded-lg transition-colors"
      style={{ color: 'var(--text-tertiary)' }}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}
