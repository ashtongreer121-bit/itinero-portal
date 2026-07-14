'use client'

import { useState, useEffect } from 'react'
import { Bell, Plus, Trash2, Clock, CheckCircle, Wand2 } from 'lucide-react'
import type { TripReminder, Trip, TripEvent } from '@/lib/supabase/types'

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

const PRESETS = [
  { label: '7 days before', days: 7 },
  { label: '3 days before', days: 3 },
  { label: '1 day before', days: 1 },
  { label: 'Day of trip', days: 0 },
]

export default function ReminderScheduler({ trip, events }: { trip: Trip; events: TripEvent[] }) {
  const [open, setOpen] = useState(false)
  const [reminders, setReminders] = useState<TripReminder[]>([])
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ recipient_email: trip.traveler_email ?? '', subject: '', body: '', send_at: '' })

  useEffect(() => {
    if (!open) return
    fetch(`/api/trips/${trip.id}/reminders`).then(r => r.json()).then(setReminders)
  }, [open, trip.id])

  function applyPreset(days: number) {
    const d = new Date(trip.start_date)
    d.setDate(d.getDate() - days)
    d.setHours(9, 0, 0, 0)
    setForm(f => ({
      ...f,
      send_at: d.toISOString().slice(0, 16),
      subject: days === 0 ? `Your trip to ${trip.destination ?? trip.title} starts today! 🗺️`
        : `${days} day${days !== 1 ? 's' : ''} until your trip to ${trip.destination ?? trip.title}! ✈️`,
    }))
  }

  async function draftWithAI() {
    setDrafting(true)
    const res = await fetch('/api/ai/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip, events, tone: 'warm and friendly' }),
    })
    if (res.ok) {
      const data = await res.json()
      setForm(f => ({ ...f, body: data.draft, subject: f.subject || data.subject }))
    }
    setDrafting(false)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/trips/${trip.id}/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const r = await res.json()
      setReminders(rs => [...rs, r].sort((a, b) => new Date(a.send_at).getTime() - new Date(b.send_at).getTime()))
      setForm({ recipient_email: trip.traveler_email ?? '', subject: '', body: '', send_at: '' })
    }
    setSaving(false)
  }

  async function remove(reminderId: string) {
    await fetch(`/api/trips/${trip.id}/reminders`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId }),
    })
    setReminders(rs => rs.filter(r => r.id !== reminderId))
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover-bg transition-colors">
        <Bell className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Reminders</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {reminders.length > 0 ? `${reminders.length} scheduled` : 'Schedule automated emails'}
          </p>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
          {/* Existing reminders */}
          {reminders.length > 0 && (
            <div className="px-5 py-3 space-y-2 border-b" style={{ borderColor: 'var(--border)' }}>
              {reminders.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg)' }}>
                  {r.status === 'sent'
                    ? <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--success)' }} />
                    : <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.subject}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(r.send_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {' · '}{r.recipient_email}
                    </p>
                  </div>
                  <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                    style={{ background: r.status === 'sent' ? '#D1FAE5' : 'var(--border)', color: r.status === 'sent' ? '#065F46' : 'var(--text-secondary)' }}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <button onClick={() => remove(r.id)} className="hover-danger p-1 rounded" style={{ color: 'var(--text-tertiary)' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <form onSubmit={save} className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>New Reminder</p>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => applyPreset(p.days)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover-accent"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  {p.label}
                </button>
              ))}
            </div>

            <input type="email" required value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))}
              placeholder="Recipient email" className={inputCls} style={inputStyle} />
            <input required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Subject" className={inputCls} style={inputStyle} />

            <div className="flex gap-2">
              <textarea rows={3} required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Message body…" className={`${inputCls} flex-1 resize-none text-xs`} style={inputStyle} />
              <button type="button" onClick={draftWithAI} disabled={drafting}
                className="flex flex-col items-center justify-center gap-1 px-2.5 rounded-lg text-xs disabled:opacity-50 shrink-0"
                style={{ background: 'linear-gradient(135deg,#6B82FF,#A78BFA)', color: 'white', width: '44px' }}>
                <Wand2 className="w-3.5 h-3.5" />
                <span style={{ fontSize: '9px' }}>{drafting ? '…' : 'AI'}</span>
              </button>
            </div>

            <input type="datetime-local" required value={form.send_at} onChange={e => setForm(f => ({ ...f, send_at: e.target.value }))}
              className={inputCls} style={inputStyle} />

            <button type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              <Plus className="w-3.5 h-3.5" />{saving ? 'Scheduling…' : 'Schedule Reminder'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
