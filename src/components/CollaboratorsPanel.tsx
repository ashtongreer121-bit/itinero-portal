'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Clock, CheckCircle } from 'lucide-react'
import type { TripMember } from '@/lib/supabase/types'

export default function CollaboratorsPanel({ tripId }: { tripId: string }) {
  const [members, setMembers] = useState<TripMember[]>([])
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'editor' | 'viewer'>('editor')
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch(`/api/trips/${tripId}/collaborators`).then(r => r.json()).then(setMembers)
  }, [open, tripId])

  async function invite(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch(`/api/trips/${tripId}/collaborators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    })
    if (res.ok) {
      const m = await res.json()
      setMembers(ms => [...ms.filter(x => x.id !== m.id), m])
      setEmail('')
    }
    setAdding(false)
  }

  async function remove(memberId: string) {
    await fetch(`/api/trips/${tripId}/collaborators`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    setMembers(ms => ms.filter(m => m.id !== memberId))
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover-bg transition-colors">
        <Users className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Collaborators</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {members.length > 0 ? `${members.length} member${members.length !== 1 ? 's' : ''}` : 'Share with team members'}
          </p>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <form onSubmit={invite} className="flex gap-2 pt-3">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="colleague@agency.com"
              className="flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            />
            <select value={role} onChange={e => setRole(e.target.value as 'editor' | 'viewer')}
              className="rounded-lg px-2 py-2 text-xs focus:outline-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button type="submit" disabled={adding}
              className="p-2 rounded-lg text-white disabled:opacity-50 shrink-0"
              style={{ background: 'var(--accent)' }}>
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {members.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: 'var(--text-tertiary)' }}>
              No collaborators yet
            </p>
          ) : (
            <div className="space-y-1.5">
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--bg)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: m.role === 'editor' ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                    {(m.email ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{m.email}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{m.role}</span>
                      {m.status === 'pending'
                        ? <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}><Clock className="w-3 h-3" /> Pending</span>
                        : <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--success)' }}><CheckCircle className="w-3 h-3" /> Active</span>
                      }
                    </div>
                  </div>
                  <button onClick={() => remove(m.id)} className="hover-danger p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
