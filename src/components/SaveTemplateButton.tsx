'use client'

import { useState } from 'react'
import { LayoutTemplate, Check } from 'lucide-react'

export default function SaveTemplateButton({ tripId }: { tripId: string }) {
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  async function save() {
    setSaving(true)
    await fetch(`/api/trips/${tripId}/save-template`, { method: 'POST' })
    setSaving(false)
    setDone(true)
    setTimeout(() => setDone(false), 2500)
  }

  return (
    <button onClick={save} disabled={saving || done}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-70"
      style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
      {done ? <><Check className="w-3 h-3" /> Saved!</> : saving ? 'Saving…' : <><LayoutTemplate className="w-3 h-3" /> Template</>}
    </button>
  )
}
