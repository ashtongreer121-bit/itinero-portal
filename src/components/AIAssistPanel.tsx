'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Send } from 'lucide-react'
import type { Trip, TripEvent } from '@/lib/supabase/types'

const EVENT_ICONS: Record<string, string> = {
  flight: '✈️', hotel: '🏨', restaurant: '🍽️',
  activity: '🎭', transfer: '🚗', carRental: '🚙', cruise: '🛳️',
}

type Message = { role: 'user' | 'assistant'; text: string }

export default function AIAssistPanel({ trip, existingEvents, onEventsAdded }: {
  trip: Trip
  existingEvents: TripEvent[]
  onEventsAdded: (events: TripEvent[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const prompt = input.trim()
    if (!prompt || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: prompt }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: trip.destination,
          start_date: trip.start_date,
          end_date: trip.end_date,
          existing_events: existingEvents,
          prompt,
        }),
      })

      if (!res.ok) throw new Error('Request failed')
      const { events } = await res.json()
      const list: Partial<TripEvent>[] = events ?? []

      if (list.length === 0) {
        setMessages(m => [...m, { role: 'assistant', text: "I couldn't generate events for that request. Try being more specific, like 'add a dinner restaurant near the hotel on the first night'." }])
        setLoading(false)
        return
      }

      // Add events directly to the trip
      const added: TripEvent[] = []
      for (const ev of list) {
        const r = await fetch(`/api/trips/${trip.id}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...ev, trip_id: trip.id }),
        })
        if (r.ok) added.push(await r.json())
      }

      onEventsAdded(added)

      const summary = added.map(e => `${EVENT_ICONS[e.event_type] ?? '📍'} ${e.title}`).join('\n')
      setMessages(m => [...m, {
        role: 'assistant',
        text: `Added ${added.length} event${added.length !== 1 ? 's' : ''} to your itinerary:\n${summary}`,
      }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Something went wrong. Please try again.' }])
    }

    setLoading(false)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-5 py-4 text-left transition-colors hover-bg">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #6B82FF, #A78BFA)' }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Assist</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ask me to add events to this trip</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />}
      </button>

      {open && (
        <div className="border-t flex flex-col" style={{ borderColor: 'var(--border)', height: '320px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <Sparkles className="w-6 h-6" style={{ color: 'var(--text-tertiary)' }} />
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Describe what to add — e.g.<br />
                  <em>"add a nice dinner near the hotel on night 2"</em>
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap"
                  style={m.role === 'user'
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                  }>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t flex gap-2 items-end" style={{ borderColor: 'var(--border)' }}>
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Add a dinner restaurant near the hotel…"
              className="flex-1 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', maxHeight: '80px' }}
            />
            <button onClick={send} disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #6B82FF, #A78BFA)' }}>
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
