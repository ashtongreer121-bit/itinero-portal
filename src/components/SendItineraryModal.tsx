'use client'

import { useState } from 'react'
import { Send, Wand2, X, Mail, ChevronDown } from 'lucide-react'
import type { Trip, TripEvent } from '@/lib/supabase/types'

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

export default function SendItineraryModal({ trip, events, onClose }: {
  trip: Trip
  events: TripEvent[]
  onClose: () => void
}) {
  const [to, setTo] = useState(trip.traveler_email ?? '')
  const [subject, setSubject] = useState(`Your ${trip.title} Itinerary is Ready! ✈️`)
  const [body, setBody] = useState('')
  const [tone, setTone] = useState('professional')
  const [drafting, setDrafting] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function draftWithAI() {
    setDrafting(true)
    const res = await fetch('/api/ai/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip, events, tone }),
    })
    if (res.ok) {
      const data = await res.json()
      setBody(data.draft)
      setSubject(data.subject)
    }
    setDrafting(false)
  }

  async function send() {
    setSending(true)
    const res = await fetch(`/api/trips/${trip.id}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    })
    if (res.ok) { setSent(true); setTimeout(onClose, 1800) }
    else setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <Mail className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Send Itinerary</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{trip.title}</p>
          </div>
          <button onClick={onClose} className="icon-btn p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {sent ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Email sent!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Closing…</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
                  style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>To</label>
                <input type="email" value={to} onChange={e => setTo(e.target.value)}
                  placeholder="traveler@email.com" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
                  style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Subject</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} style={inputStyle} />
              </div>

              {/* AI Draft */}
              <div className="flex items-center gap-2 py-1">
                <div className="relative flex-1">
                  <select value={tone} onChange={e => setTone(e.target.value)}
                    className={`${inputCls} appearance-none pr-8`} style={inputStyle}>
                    <option value="professional">Professional tone</option>
                    <option value="warm and friendly">Warm & friendly</option>
                    <option value="luxury concierge">Luxury concierge</option>
                    <option value="casual">Casual</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <button onClick={draftWithAI} disabled={drafting}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold shrink-0 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #6B82FF, #A78BFA)', color: 'white' }}>
                  <Wand2 className="w-3 h-3" />
                  {drafting ? 'Drafting…' : 'AI Draft'}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
                  style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Message</label>
                <textarea rows={8} value={body} onChange={e => setBody(e.target.value)}
                  placeholder="Write your message or use AI Draft above…"
                  className={`${inputCls} resize-none text-xs`} style={inputStyle} />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
                <button onClick={send} disabled={sending || !to || !body}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: 'var(--accent)' }}>
                  <Send className="w-3.5 h-3.5" />
                  {sending ? 'Sending…' : 'Send Email'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
