'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutTemplate, Trash2, Plus, Calendar, MapPin, ArrowRight } from 'lucide-react'
import type { TripTemplate } from '@/lib/supabase/types'

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

export default function TemplatesManager({ initial }: { initial: TripTemplate[] }) {
  const router = useRouter()
  const [templates, setTemplates] = useState(initial)
  const [using, setUsing] = useState<string | null>(null)
  const [useForm, setUseForm] = useState({ start_date: '', traveler_name: '', traveler_email: '' })
  const [saving, setSaving] = useState(false)

  async function handleDelete(id: string) {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    setTemplates(ts => ts.filter(t => t.id !== id))
  }

  async function handleUse(templateId: string) {
    setSaving(true)
    const res = await fetch(`/api/templates/${templateId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(useForm),
    })
    if (res.ok) {
      const { id } = await res.json()
      router.push(`/dashboard/trips/${id}`)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <div className="text-center py-24 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
          <LayoutTemplate className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No templates yet</p>
          <p className="text-xs mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Open any trip and click &ldquo;Save as Template&rdquo; to reuse it for future clients.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="rounded-xl overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {/* Color bar */}
              <div className="h-1.5 w-full" style={{ background: t.color_theme }} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t.name}</p>
                    {t.description && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.description}</p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(t.id)}
                    className="hover-danger p-1.5 rounded-lg shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  {t.destination && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin className="w-3 h-3" /> {t.destination}
                    </span>
                  )}
                  {t.duration_days && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <Calendar className="w-3 h-3" /> {t.duration_days} days
                    </span>
                  )}
                </div>

                {using === t.id ? (
                  <div className="space-y-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    <input type="date" required value={useForm.start_date}
                      onChange={e => setUseForm(f => ({ ...f, start_date: e.target.value }))}
                      className={inputCls} style={inputStyle} />
                    <input value={useForm.traveler_name}
                      onChange={e => setUseForm(f => ({ ...f, traveler_name: e.target.value }))}
                      placeholder="Traveler name (optional)" className={inputCls} style={inputStyle} />
                    <input type="email" value={useForm.traveler_email}
                      onChange={e => setUseForm(f => ({ ...f, traveler_email: e.target.value }))}
                      placeholder="Traveler email (optional)" className={inputCls} style={inputStyle} />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setUsing(null)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        Cancel
                      </button>
                      <button onClick={() => handleUse(t.id)} disabled={!useForm.start_date || saving}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}>
                        {saving ? 'Creating…' : 'Create Trip'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setUsing(t.id); setUseForm({ start_date: '', traveler_name: '', traveler_email: '' }) }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
                    <Plus className="w-3.5 h-3.5" /> Use Template <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
