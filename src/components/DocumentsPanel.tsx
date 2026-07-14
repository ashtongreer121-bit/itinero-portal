'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, FileText, Image, Plus, Trash2, ExternalLink, X } from 'lucide-react'
import type { TripDocument } from '@/lib/supabase/types'

const TYPE_ICONS = {
  link:     { icon: Link2,     label: 'Link',     color: '#3D5AFE' },
  document: { icon: FileText,  label: 'Document', color: '#059669' },
  image:    { icon: Image,     label: 'Image',    color: '#7C3AED' },
}

export default function DocumentsPanel({ tripId, initial }: { tripId: string; initial: TripDocument[] }) {
  const router = useRouter()
  const [docs, setDocs] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', type: 'link' as TripDocument['type'], notes: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/trips/${tripId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const doc = await res.json()
      setDocs(d => [...d, doc])
      setForm({ name: '', url: '', type: 'link', notes: '' })
      setAdding(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete(docId: string) {
    setDeleting(docId)
    await fetch(`/api/trips/${tripId}/documents/${docId}`, { method: 'DELETE' })
    setDocs(d => d.filter(x => x.id !== docId))
    setDeleting(null)
  }

  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const inputCls = "w-full rounded-lg px-3 py-2 text-sm focus:outline-none"

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--surface)', borderBottom: docs.length > 0 || adding ? '1px solid var(--border)' : 'none' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          Documents
        </p>
        <button onClick={() => setAdding(a => !a)}
          className="p-1 rounded-lg transition-colors"
          style={{ color: adding ? 'var(--accent)' : 'var(--text-tertiary)' }}
>
          {adding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="p-4 space-y-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="grid grid-cols-3 gap-1.5">
            {(['link', 'document', 'image'] as const).map(t => {
              const cfg = TYPE_ICONS[t]
              const Icon = cfg.icon
              return (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    border: `1px solid ${form.type === t ? cfg.color : 'var(--border)'}`,
                    background: form.type === t ? `${cfg.color}14` : 'var(--bg)',
                    color: form.type === t ? cfg.color : 'var(--text-secondary)',
                  }}>
                  <Icon className="w-3 h-3" /> {cfg.label}
                </button>
              )
            })}
          </div>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Name" className={inputCls} style={inputStyle} />
          <input required value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            placeholder="URL (https://...)" type="url" className={inputCls} style={inputStyle} />
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" className={inputCls} style={inputStyle} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {docs.length === 0 && !adding ? (
        <div className="px-4 py-6 text-center" style={{ background: 'var(--surface)' }}>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No documents yet</p>
        </div>
      ) : (
        docs.map((doc, i) => {
          const cfg = TYPE_ICONS[doc.type] ?? TYPE_ICONS.link
          const Icon = cfg.icon
          return (
            <div key={doc.id} className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'var(--surface)', borderBottom: i < docs.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${cfg.color}14` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{doc.name}</p>
                {doc.notes && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{doc.notes}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="hover-accent p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                  className="hover-danger p-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
