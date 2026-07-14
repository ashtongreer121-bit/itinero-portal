'use client'

import { useState } from 'react'
import { Copy, Check, Globe } from 'lucide-react'
import type { Trip } from '@/lib/supabase/types'

export default function TripCodeCard({ trip }: { trip: Trip }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  async function copyCode() {
    await navigator.clipboard.writeText(trip.trip_code)
    setCopied('code')
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyLink() {
    const url = `${window.location.origin}/trip/${trip.trip_code}`
    await navigator.clipboard.writeText(url)
    setCopied('link')
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--accent)', color: 'white' }}>
      <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ opacity: 0.65, letterSpacing: '0.12em' }}>
        Trip Code
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-3xl font-bold tracking-widest font-mono" style={{ letterSpacing: '0.2em' }}>
          {trip.trip_code}
        </span>
        <button onClick={copyCode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
          {copied === 'code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === 'code' ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="mt-4 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <p className="text-xs mb-1" style={{ opacity: 0.6 }}>Share with traveler</p>
        <button onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}>
          {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
          {copied === 'link' ? 'Link copied!' : 'Copy web link'}
        </button>
        <a href={`/portal/${trip.trip_code}`} target="_blank" rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.12)', color: 'white', display: 'flex' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}>
          <Globe className="w-3.5 h-3.5" /> Open Client Portal
        </a>
      </div>
    </div>
  )
}
