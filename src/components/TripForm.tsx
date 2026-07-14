'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Trip } from '@/lib/supabase/types'

const COLORS = [
  { label: 'Indigo',   value: '#3D5AFE' },
  { label: 'Sky',      value: '#0EA5E9' },
  { label: 'Sunset',   value: '#F97316' },
  { label: 'Forest',   value: '#059669' },
  { label: 'Violet',   value: '#7C3AED' },
  { label: 'Rose',     value: '#E11D48' },
]

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none"
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

export default function TripForm({ trip }: { trip?: Trip }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title:          trip?.title ?? '',
    destination:    trip?.destination ?? '',
    start_date:     trip?.start_date ? trip.start_date.slice(0, 10) : '',
    end_date:       trip?.end_date   ? trip.end_date.slice(0, 10)   : '',
    color_theme:    trip?.color_theme ?? '#3D5AFE',
    traveler_name:  trip?.traveler_name  ?? '',
    traveler_email: trip?.traveler_email ?? '',
    notes:          trip?.notes ?? '',
  })

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      ...form,
      destination:    form.destination    || null,
      traveler_name:  form.traveler_name  || null,
      traveler_email: form.traveler_email || null,
      notes:          form.notes          || null,
    }

    const res = trip
      ? await fetch(`/api/trips/${trip.id}`, { method: 'PATCH', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      : await fetch('/api/trips',             { method: 'POST',  body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })

    if (!res.ok) { setError((await res.json()).error); setLoading(false); return }
    const data = await res.json()
    router.push(`/dashboard/trips/${trip?.id ?? data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormSection title="Trip Details">
        <Field label="Title" required>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="e.g. Paris Honeymoon 2025" />
        </Field>
        <Field label="Destination">
          <input value={form.destination} onChange={e => set('destination', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="e.g. Paris, France" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date" required>
            <input type="date" required value={form.start_date} onChange={e => set('start_date', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
          <Field label="End Date" required>
            <input type="date" required value={form.end_date} min={form.start_date} onChange={e => set('end_date', e.target.value)}
              className={inputCls} style={inputStyle} />
          </Field>
        </div>
        <Field label="Color Theme">
          <div className="flex gap-2 pt-1">
            {COLORS.map(c => (
              <button key={c.value} type="button" onClick={() => set('color_theme', c.value)} title={c.label}
                className="w-7 h-7 rounded-full transition-all"
                style={{
                  background: c.value,
                  outline: form.color_theme === c.value ? `3px solid ${c.value}` : 'none',
                  outlineOffset: '2px',
                  transform: form.color_theme === c.value ? 'scale(1.15)' : 'scale(1)',
                }} />
            ))}
          </div>
        </Field>
      </FormSection>

      <FormSection title="Traveler">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input value={form.traveler_name} onChange={e => set('traveler_name', e.target.value)}
              className={inputCls} style={inputStyle} placeholder="e.g. John & Jane Smith" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.traveler_email} onChange={e => set('traveler_email', e.target.value)}
              className={inputCls} style={inputStyle} placeholder="traveler@example.com" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Notes">
        <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
          className={`${inputCls} resize-none`} style={inputStyle}
          placeholder="Visible to the traveler in the app…" />
      </FormSection>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)' }}>
          {loading ? 'Saving…' : trip ? 'Save Changes' : 'Create Trip'}
        </button>
      </div>
    </form>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}
