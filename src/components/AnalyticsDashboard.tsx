'use client'

import { useMemo } from 'react'
import { TrendingUp, Users, DollarSign, MapPin, Calendar, CheckCircle } from 'lucide-react'

type Trip = { id: string; destination: string | null; start_date: string; end_date: string; color_theme: string; title: string }
type Client = { id: string }
type Invoice = { amount: number; status: string; created_at: string }
type Event = { trip_id: string; event_type: string }

function StatCard({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{label}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '22', color: accent }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
    </div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 rounded-full flex-1" style={{ background: 'var(--border)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  const w = 120, h = 36, pad = 2
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1 || 1)) * (w - pad * 2)
    const y = h - pad - (v / max) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const area = `${pad},${h} ` + pts + ` ${w - pad},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <polygon points={area} fill={color + '22'} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AnalyticsDashboard({ trips, clients, invoices, events }: {
  trips: Trip[]
  clients: Client[]
  invoices: Invoice[]
  events: Event[]
}) {
  const now = new Date()
  const thisYear = now.getFullYear()

  const stats = useMemo(() => {
    const upcoming = trips.filter(t => new Date(t.start_date) > now)
    const active = trips.filter(t => new Date(t.start_date) <= now && new Date(t.end_date) >= now)
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
    const outstanding = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + Number(i.amount), 0)

    // Monthly trips this year
    const monthly = Array.from({ length: 12 }, (_, m) =>
      trips.filter(t => {
        const d = new Date(t.start_date)
        return d.getFullYear() === thisYear && d.getMonth() === m
      }).length
    )

    // Top destinations
    const destMap = new Map<string, number>()
    trips.forEach(t => { if (t.destination) destMap.set(t.destination, (destMap.get(t.destination) ?? 0) + 1) })
    const topDests = Array.from(destMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Event type breakdown
    const typeMap = new Map<string, number>()
    events.forEach(e => typeMap.set(e.event_type, (typeMap.get(e.event_type) ?? 0) + 1))
    const topTypes = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Monthly revenue
    const monthlyRevenue = Array.from({ length: 12 }, (_, m) =>
      invoices.filter(i => {
        const d = new Date(i.created_at)
        return d.getFullYear() === thisYear && d.getMonth() === m && i.status === 'paid'
      }).reduce((s, i) => s + Number(i.amount), 0)
    )

    return { upcoming, active, totalRevenue, outstanding, monthly, topDests, topTypes, monthlyRevenue }
  }, [trips, clients, invoices, events])

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const accent = 'var(--accent)'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Trips" value={trips.length} sub={`${stats.active.length} active now`} icon={<Calendar className="w-4 h-4" />} accent="#3D5AFE" />
        <StatCard label="Clients" value={clients.length} icon={<Users className="w-4 h-4" />} accent="#7C3AED" />
        <StatCard label="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} sub={`$${stats.outstanding.toLocaleString()} outstanding`} icon={<DollarSign className="w-4 h-4" />} accent="#059669" />
        <StatCard label="Upcoming" value={stats.upcoming.length} sub="trips scheduled" icon={<TrendingUp className="w-4 h-4" />} accent="#D97706" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Trips per month */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Trips by Month</p>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{thisYear}</span>
          </div>
          <div className="flex items-end gap-1.5 h-24">
            {stats.monthly.map((v, i) => {
              const maxV = Math.max(...stats.monthly, 1)
              const pct = (v / maxV) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t transition-all" style={{ height: `${pct}%`, minHeight: v > 0 ? '4px' : '0', background: 'var(--accent)', opacity: now.getMonth() === i ? 1 : 0.4 }} />
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>{months[i]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Revenue sparkline */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Revenue</p>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{thisYear}</span>
          </div>
          <p className="text-2xl font-black mb-3" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            ${stats.totalRevenue.toLocaleString()}
          </p>
          <SparkLine data={stats.monthlyRevenue} color="#059669" />
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Paid</p>
              <p className="text-sm font-bold" style={{ color: 'var(--success)' }}>${stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Pending</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${stats.outstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top destinations */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Destinations</p>
          {stats.topDests.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No trip destinations yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topDests.map(([dest, count]) => (
                <div key={dest} className="flex items-center gap-3">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{dest}</span>
                  <MiniBar value={count} max={stats.topDests[0]?.[1] ?? 1} color="#3D5AFE" />
                  <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event breakdown */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Event Types</p>
          {stats.topTypes.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No events yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topTypes.map(([type, count]) => {
                const icons: Record<string, string> = { flight: '✈️', hotel: '🏨', restaurant: '🍽️', activity: '🎭', transfer: '🚗', carRental: '🚙', cruise: '🛳️' }
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-base shrink-0">{icons[type] ?? '📍'}</span>
                    <span className="text-sm flex-1 capitalize" style={{ color: 'var(--text-primary)' }}>{type}</span>
                    <MiniBar value={count} max={stats.topTypes[0]?.[1] ?? 1} color="#7C3AED" />
                    <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text-secondary)' }}>{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent trips */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Recent Trips</p>
        </div>
        {trips.slice(0, 8).map((t, i) => {
          const isPast = new Date(t.end_date) < now
          const isActive = new Date(t.start_date) <= now && new Date(t.end_date) >= now
          return (
            <a key={t.id} href={`/dashboard/trips/${t.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover-bg transition-colors"
              style={{ borderBottom: i < Math.min(trips.length, 8) - 1 ? '1px solid var(--border)' : 'none', background: 'var(--surface)' }}>
              <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: t.color_theme }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(t.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: isActive ? '#059669' + '22' : isPast ? 'var(--border)' : 'var(--accent-light)',
                    color: isActive ? '#059669' : isPast ? 'var(--text-tertiary)' : 'var(--accent-text)'
                  }}>
                  {isActive ? 'Active' : isPast ? 'Past' : 'Upcoming'}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
