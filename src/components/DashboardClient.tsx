'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, MapPin, Calendar, ArrowRight, Search, TrendingUp, Clock, Users, Plane } from 'lucide-react'
import type { Trip } from '@/lib/supabase/types'
import DeleteTripButton from '@/components/DeleteTripButton'

export default function DashboardClient({ trips }: { trips: Trip[] }) {
  const [query, setQuery] = useState('')
  const now = new Date()

  const upcoming = trips.filter(t => new Date(t.end_date) >= now)
  const past     = trips.filter(t => new Date(t.end_date) < now)

  // This week's trips
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const thisWeek = trips.filter(t => {
    const s = new Date(t.start_date), e = new Date(t.end_date)
    return s <= weekEnd && e >= now
  })

  const travelers = new Set(trips.map(t => t.traveler_email).filter(Boolean)).size

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return trips
    return trips.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.destination?.toLowerCase().includes(q) ||
      t.traveler_name?.toLowerCase().includes(q) ||
      t.trip_code?.toLowerCase().includes(q)
    )
  }, [trips, query])

  const filteredUpcoming = filtered.filter(t => new Date(t.end_date) >= now)
  const filteredPast     = filtered.filter(t => new Date(t.end_date) < now)

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Trips
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {trips.length === 0 ? 'No trips yet' : `${upcoming.length} upcoming · ${past.length} past`}
          </p>
        </div>
        <Link href="/dashboard/trips/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)' }}>
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Trip
        </Link>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {trips.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard icon={Plane}    label="Total trips"   value={trips.length}      color="#3D5AFE" />
              <StatCard icon={TrendingUp} label="Upcoming"   value={upcoming.length}   color="#059669" />
              <StatCard icon={Clock}    label="Active now"    value={thisWeek.length}   color="#F97316" />
              <StatCard icon={Users}    label="Travelers"     value={travelers || trips.filter(t => t.traveler_name).length} color="#7C3AED" />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by title, destination, traveler…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              {query && (
                <button onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-1.5 py-0.5 rounded"
                  style={{ color: 'var(--text-tertiary)' }}>
                  ✕
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No trips match &ldquo;{query}&rdquo;</p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredUpcoming.length > 0 && (
                  <TripSection label="Upcoming" trips={filteredUpcoming} />
                )}
                {filteredPast.length > 0 && (
                  <TripSection label="Past" trips={filteredPast} muted />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {value}
      </p>
    </div>
  )
}

function TripSection({ label, trips, muted }: { label: string; trips: Trip[]; muted?: boolean }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          {label}
        </p>
        <span className="text-xs px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
          {trips.length}
        </span>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {trips.map((trip, i) => (
          <TripRow key={trip.id} trip={trip} last={i === trips.length - 1} muted={muted} />
        ))}
      </div>
    </section>
  )
}

function TripRow({ trip, last, muted }: { trip: Trip; last: boolean; muted?: boolean }) {
  const start = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const end   = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex items-center gap-4 px-5 py-4 transition-colors"
      style={{
        background: 'var(--surface)',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        opacity: muted ? 0.65 : 1,
      }}
>

      <div className="w-0.5 self-stretch rounded-full shrink-0"
        style={{ background: trip.color_theme || 'var(--accent)', minHeight: '32px' }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {trip.title}
          </span>
          {trip.trip_code && (
            <span className="shrink-0 font-mono text-xs px-2 py-0.5 rounded"
              style={{ background: 'var(--accent-light)', color: 'var(--accent-text)', fontWeight: 600, letterSpacing: '0.08em' }}>
              {trip.trip_code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {trip.destination && (
            <span className="flex items-center gap-1 text-xs">
              <MapPin className="w-3 h-3" /> {trip.destination}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs">
            <Calendar className="w-3 h-3" /> {start} – {end}
          </span>
          {trip.traveler_name && (
            <span className="text-xs">· {trip.traveler_name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <DeleteTripButton tripId={trip.id} />
        <Link href={`/dashboard/trips/${trip.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
          Open <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="max-w-sm mx-auto text-center py-24">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--accent-light)' }}>
        <MapPin className="w-6 h-6" style={{ color: 'var(--accent)' }} />
      </div>
      <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>
        No trips yet
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Create your first trip and share a code with your client — they'll see the full itinerary in the Itinero app.
      </p>
      <Link href="/dashboard/trips/new"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
        style={{ background: 'var(--accent)' }}>
        <Plus className="w-4 h-4" /> Create First Trip
      </Link>
    </div>
  )
}
