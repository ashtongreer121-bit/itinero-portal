'use client'

import { useState } from 'react'
import { Plus, Trash2, Send, CheckCircle, FileText, ChevronDown, ChevronUp, X } from 'lucide-react'
import type { Invoice } from '@/lib/supabase/types'

type TripOption = { id: string; title: string; traveler_email: string | null }
type ClientOption = { id: string; name: string; email: string | null }

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:   { bg: 'var(--border)',       color: 'var(--text-secondary)' },
  sent:    { bg: 'var(--accent-light)', color: 'var(--accent-text)' },
  paid:    { bg: '#D1FAE5',             color: '#065F46' },
  overdue: { bg: '#FEE2E2',             color: '#991B1B' },
}

const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

type InvoiceRow = Invoice & { trips?: { title: string } | null; clients?: { name: string } | null }

export default function InvoiceManager({ initial, trips, clients }: {
  initial: InvoiceRow[]
  trips: TripOption[]
  clients: ClientOption[]
}) {
  const [invoices, setInvoices] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [sendTo, setSendTo] = useState('')

  const [form, setForm] = useState({
    trip_id: '', client_id: '', amount: '', currency: 'USD',
    due_date: '', notes: '',
    line_items: [{ description: '', quantity: 1, unit_price: 0 }],
  })

  function calcTotal() {
    return form.line_items.reduce((s, li) => s + li.quantity * li.unit_price, 0)
  }

  function addLine() { setForm(f => ({ ...f, line_items: [...f.line_items, { description: '', quantity: 1, unit_price: 0 }] })) }
  function removeLine(i: number) { setForm(f => ({ ...f, line_items: f.line_items.filter((_, idx) => idx !== i) })) }
  function updateLine(i: number, field: string, value: string | number) {
    setForm(f => ({ ...f, line_items: f.line_items.map((li, idx) => idx === i ? { ...li, [field]: value } : li) }))
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: calcTotal() }),
    })
    if (res.ok) {
      const inv = await res.json()
      setInvoices(is => [inv, ...is])
      setCreating(false)
      setForm({ trip_id: '', client_id: '', amount: '', currency: 'USD', due_date: '', notes: '', line_items: [{ description: '', quantity: 1, unit_price: 0 }] })
    }
  }

  async function markPaid(id: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paid_at: new Date().toISOString() }),
    })
    if (res.ok) {
      const updated = await res.json()
      setInvoices(is => is.map(i => i.id === id ? { ...i, ...updated } : i))
    }
  }

  async function remove(id: string) {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    setInvoices(is => is.filter(i => i.id !== id))
  }

  async function sendInvoice(id: string) {
    setSending(id)
    await fetch(`/api/invoices/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: sendTo }),
    })
    setInvoices(is => is.map(i => i.id === id ? { ...i, status: 'sent' } : i))
    setSending(null)
    setSendTo('')
    setExpanded(null)
  }

  const totalOutstanding = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Outstanding', value: `$${totalOutstanding.toLocaleString()}`, color: 'var(--accent)' },
          { label: 'Paid', value: `$${totalPaid.toLocaleString()}`, color: 'var(--success)' },
          { label: 'Total Invoices', value: invoices.length, color: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New invoice button */}
      {!creating && (
        <button onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border-2 border-dashed transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
          <Plus className="w-4 h-4" /> New Invoice
        </button>
      )}

      {/* Create form */}
      {creating && (
        <form onSubmit={create} className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--surface)', border: '2px solid var(--accent)' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>New Invoice</p>
            <button type="button" onClick={() => setCreating(false)}><X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Trip (optional)</label>
              <select value={form.trip_id} onChange={e => setForm(f => ({ ...f, trip_id: e.target.value }))} className={inputCls} style={inputStyle}>
                <option value="">No trip</option>
                {trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Client (optional)</label>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls} style={inputStyle}>
                <option value="">No client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Line items */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Line Items</label>
            <div className="space-y-2">
              {form.line_items.map((li, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={li.description} onChange={e => updateLine(i, 'description', e.target.value)}
                    placeholder="Description" className={`${inputCls} flex-1`} style={inputStyle} required />
                  <input type="number" min="1" value={li.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))}
                    className={inputCls} style={{ ...inputStyle, width: '60px' }} />
                  <input type="number" min="0" step="0.01" value={li.unit_price} onChange={e => updateLine(i, 'unit_price', Number(e.target.value))}
                    placeholder="Price" className={inputCls} style={{ ...inputStyle, width: '90px' }} />
                  <span className="text-xs font-mono shrink-0 w-16 text-right" style={{ color: 'var(--text-secondary)' }}>
                    ${(li.quantity * li.unit_price).toFixed(2)}
                  </span>
                  {form.line_items.length > 1 && (
                    <button type="button" onClick={() => removeLine(i)}><X className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addLine}
                className="text-xs font-semibold flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                <Plus className="w-3 h-3" /> Add line
              </button>
            </div>
            <div className="flex justify-end mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Total: ${calcTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest block mb-1.5" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className={inputCls} style={inputStyle}>
                {['USD','EUR','GBP','CAD','AUD','JPY'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)" className={`${inputCls} resize-none`} style={inputStyle} />

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 rounded-lg text-xs font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--accent)' }}>Create Invoice</button>
          </div>
        </form>
      )}

      {/* Invoice list */}
      {invoices.length === 0 && !creating ? (
        <div className="text-center py-20 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
          <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>No invoices yet</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {invoices.map((inv, i) => {
            const sc = STATUS_COLORS[inv.status] ?? STATUS_COLORS.draft
            const isExp = expanded === inv.id
            return (
              <div key={inv.id} style={{ borderBottom: i < invoices.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-4 px-5 py-4" style={{ background: 'var(--surface)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{inv.invoice_number}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={sc}>{inv.status}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {inv.trips?.title ?? inv.clients?.name ?? 'No trip/client'}
                      {inv.due_date && <> · Due {new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>}
                    </p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${Number(inv.amount).toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {inv.status !== 'paid' && (
                      <button onClick={() => markPaid(inv.id)}
                        className="hover-accent p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }} title="Mark paid">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => { setExpanded(isExp ? null : inv.id); setSendTo('') }}
                      className="hover-accent p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }} title="Send">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(inv.id)}
                      className="hover-danger p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setExpanded(isExp ? null : inv.id)} className="icon-btn p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                      {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {isExp && (
                  <div className="px-5 py-4 space-y-3 border-t" style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
                    {(inv.line_items ?? []).length > 0 && (
                      <div className="space-y-1.5">
                        {inv.line_items.map((li, idx) => (
                          <div key={idx} className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                            <span>{li.description}</span>
                            <span>{li.quantity} × ${li.unit_price} = ${(li.quantity * li.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {inv.notes && <p className="text-xs italic" style={{ color: 'var(--text-tertiary)' }}>{inv.notes}</p>}
                    <div className="flex gap-2 pt-1">
                      <input type="email" value={sendTo} onChange={e => setSendTo(e.target.value)}
                        placeholder="Send to email…" className={`${inputCls} flex-1 text-xs`} style={inputStyle} />
                      <button onClick={() => sendInvoice(inv.id)} disabled={!sendTo || sending === inv.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: 'var(--accent)' }}>
                        <Send className="w-3 h-3" />{sending === inv.id ? 'Sending…' : 'Send'}
                      </button>
                    </div>
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
