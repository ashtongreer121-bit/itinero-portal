'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, User, Mail, Phone, ChevronDown, ChevronUp, Trash2, Edit2, Check, X, MapPin, Calendar } from 'lucide-react'
import type { Client } from '@/lib/supabase/types'

type TripSummary = { id: string; title: string; start_date: string; end_date: string }

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

export default function ClientsManager({
  initial, tripsByClient
}: {
  initial: Client[]
  tripsByClient: Record<string, TripSummary[]>
}) {
  const router = useRouter()
  const [clients, setClients] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [editForm, setEditForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const c = await res.json()
      setClients(cs => [...cs, c].sort((a, b) => a.name.localeCompare(b.name)))
      setForm({ name: '', email: '', phone: '', notes: '' })
      setAdding(false)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleEdit(clientId: string) {
    setSaving(true)
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setClients(cs => cs.map(c => c.id === clientId ? updated : c))
      setEditing(null)
    }
    setSaving(false)
  }

  async function handleDelete(clientId: string) {
    await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
    setClients(cs => cs.filter(c => c.id !== clientId))
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      {!adding && (
        <button onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Plus className="w-4 h-4" /> Add Client
        </button>
      )}

      {/* Add form */}
      {adding && (
        <form onSubmit={handleAdd} className="rounded-xl p-5 space-y-3"
          style={{ background: 'var(--surface)', border: '2px solid var(--accent)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>New Client</p>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Full name *" className={inputCls} style={inputStyle} />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="Email" type="email" className={inputCls} style={inputStyle} />
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="Phone" className={inputCls} style={inputStyle} />
          </div>
          <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Preferences, notes…" className={`${inputCls} resize-none`} style={inputStyle} />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--accent)' }}>
              {saving ? 'Saving…' : 'Add Client'}
            </button>
          </div>
        </form>
      )}

      {/* Client list */}
      {clients.length === 0 && !adding ? (
        <div className="text-center py-20 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
          <User className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No clients yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Add your first client to track their trips and preferences</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {clients.map((client, i) => {
            const trips = tripsByClient[client.id] ?? []
            const isOpen = expanded === client.id
            const isEditing = editing === client.id

            return (
              <div key={client.id} style={{ borderBottom: i < clients.length - 1 ? '1px solid var(--border)' : 'none' }}>
                {/* Header row */}
                <div className="flex items-center gap-3 px-5 py-4" style={{ background: 'var(--surface)' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'var(--accent)' }}>
                    {client.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {client.email && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Mail className="w-3 h-3" />{client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <Phone className="w-3 h-3" />{client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
                      {trips.length} trip{trips.length !== 1 ? 's' : ''}
                    </span>
                    <button onClick={() => { setEditing(client.id); setEditForm({ name: client.name, email: client.email ?? '', phone: client.phone ?? '', notes: client.notes ?? '' }) }}
                      className="hover-accent p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(client.id)}
                      className="hover-danger p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : client.id)}
                      className="icon-btn p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="px-5 py-4 space-y-3 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    <input value={editForm.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Name" className={inputCls} style={inputStyle} />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={editForm.email ?? ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="Email" className={inputCls} style={inputStyle} />
                      <input value={editForm.phone ?? ''} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Phone" className={inputCls} style={inputStyle} />
                    </div>
                    <textarea rows={2} value={editForm.notes ?? ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Notes / preferences" className={`${inputCls} resize-none`} style={inputStyle} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}><X className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(client.id)} disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}>
                        <Check className="w-3.5 h-3.5" /> Save
                      </button>
                    </div>
                  </div>
                )}

                {/* Trips list */}
                {isOpen && !isEditing && (
                  <div className="px-5 py-3 space-y-2 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    {client.notes && (
                      <p className="text-xs italic mb-3 pb-3 border-b" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border)' }}>
                        &ldquo;{client.notes}&rdquo;
                      </p>
                    )}
                    {trips.length === 0 ? (
                      <p className="text-xs py-2" style={{ color: 'var(--text-tertiary)' }}>No trips linked to this client yet.</p>
                    ) : (
                      trips.map(t => (
                        <a key={t.id} href={`/dashboard/trips/${t.id}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover-bg transition-colors"
                          style={{ color: 'var(--text-primary)' }}>
                          <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                          <span className="text-xs font-semibold flex-1">{t.title}</span>
                          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                            <Calendar className="w-3 h-3" />
                            {new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
