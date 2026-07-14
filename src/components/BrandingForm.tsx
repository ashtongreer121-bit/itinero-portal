'use client'

import { useState } from 'react'
import { Check, Palette } from 'lucide-react'
import type { AgencySettings } from '@/lib/supabase/types'

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = (extra?: React.CSSProperties) => ({
  background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)', ...extra
})

const PRESETS = ['#3D5AFE', '#7C3AED', '#059669', '#DC2626', '#D97706', '#0891B2', '#DB2777', '#0B1120']

export default function BrandingForm({ initial }: { initial: Partial<AgencySettings> }) {
  const [form, setForm] = useState({
    agency_name: initial.agency_name ?? '',
    brand_color: initial.brand_color ?? '#3D5AFE',
    logo_url: initial.logo_url ?? '',
    email_from_name: initial.email_from_name ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/agency/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={save} className="rounded-xl p-6 space-y-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2.5 mb-1">
        <Palette className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Agency Branding</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Agency Name</label>
          <input value={form.agency_name} onChange={e => setForm(f => ({ ...f, agency_name: e.target.value }))}
            placeholder="Sunrise Travel Co." className={inputCls} style={inputStyle()} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Email Sender Name</label>
          <input value={form.email_from_name} onChange={e => setForm(f => ({ ...f, email_from_name: e.target.value }))}
            placeholder="Ashton at Sunrise Travel" className={inputCls} style={inputStyle()} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5"
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Logo URL</label>
        <input value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
          placeholder="https://…/logo.png" className={inputCls} style={inputStyle()} />
        {form.logo_url && (
          <img src={form.logo_url} alt="Logo preview" className="mt-2 h-10 object-contain rounded" />
        )}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest block mb-2"
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Brand Color</label>
        <div className="flex items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, brand_color: c }))}
                className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                style={{ background: c, borderColor: form.brand_color === c ? 'var(--text-primary)' : 'transparent' }} />
            ))}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <input type="color" value={form.brand_color} onChange={e => setForm(f => ({ ...f, brand_color: e.target.value }))}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{form.brand_color}</span>
          </div>
        </div>
        {/* Preview strip */}
        <div className="mt-3 rounded-lg p-3 flex items-center gap-3"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <div className="w-6 h-12 rounded" style={{ background: form.brand_color }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{form.agency_name || 'Your Agency'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>This color appears on PDFs, emails, and trip cards</p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving || saved}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-70"
        style={{ background: saved ? 'var(--success)' : 'var(--accent)' }}>
        {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : 'Save Branding'}
      </button>
    </form>
  )
}
