'use client'

import type { Trip, TripEvent, EventType } from '@/lib/supabase/types'

const EVENT_CONFIG: Record<string, { emoji: string; color: string }> = {
  flight:     { emoji: '✈️', color: '#3D5AFE' },
  hotel:      { emoji: '🏨', color: '#059669' },
  restaurant: { emoji: '🍽️', color: '#F97316' },
  activity:   { emoji: '🎭', color: '#7C3AED' },
  transfer:   { emoji: '🚗', color: '#0EA5E9' },
  carRental:  { emoji: '🚙', color: '#6B7A99' },
  cruise:     { emoji: '🛳️', color: '#E11D48' },
}

function groupByDay(events: TripEvent[]) {
  const map = new Map<string, TripEvent[]>()
  for (const ev of events) {
    const day = ev.start_time.slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(ev)
  }
  return map
}

export default function TravelerPreview({ trip, events }: { trip: Trip; events: TripEvent[] }) {
  const grouped = groupByDay(events)
  const accentColor = trip.color_theme || '#3D5AFE'

  const start = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const end   = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="w-full max-w-sm">
      {/* Phone frame */}
      <div className="rounded-[2.5rem] overflow-hidden shadow-2xl" style={{ border: '8px solid #1a1a2e' }}>
        {/* Status bar */}
        <div className="h-7 flex items-center justify-between px-5" style={{ background: accentColor }}>
          <span className="text-xs font-semibold text-white opacity-80">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-2 rounded-sm border border-white opacity-80" style={{ padding: '1px' }}>
              <div className="h-full w-3/4 bg-white rounded-sm" />
            </div>
          </div>
        </div>

        {/* Trip header */}
        <div className="px-5 pt-5 pb-6" style={{ background: accentColor }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-1 opacity-70 text-white">
            {trip.destination ?? 'Your Trip'}
          </p>
          <h1 className="text-xl font-bold text-white leading-tight mb-1">{trip.title}</h1>
          <p className="text-xs text-white opacity-70">{start} – {end}</p>
          {trip.traveler_name && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                {trip.traveler_name[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-white opacity-90">{trip.traveler_name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ background: '#F0F4FA', maxHeight: '580px' }}>
          {events.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm" style={{ color: '#6B7A99' }}>No events yet</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {Array.from(grouped.entries()).map(([day, dayEvents]) => (
                <div key={day}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: '#9BAAC4', letterSpacing: '0.1em' }}>
                    {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="space-y-2">
                    {dayEvents.map(ev => {
                      const cfg = EVENT_CONFIG[ev.event_type ?? ''] ?? { emoji: '📍', color: '#6B7A99' }
                      const time = new Date(ev.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      return (
                        <div key={ev.id} className="rounded-2xl p-3.5 shadow-sm"
                          style={{ background: '#FFFFFF' }}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                              style={{ background: `${cfg.color}18` }}>
                              {cfg.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm leading-tight" style={{ color: '#0B1120' }}>{ev.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#6B7A99' }}>{time}</p>
                              {ev.location_name && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: '#9BAAC4' }}>📍 {ev.location_name}</p>
                              )}
                              {ev.confirmation_code && (
                                <p className="text-xs mt-1.5 font-mono font-semibold px-2 py-0.5 rounded-md inline-block"
                                  style={{ background: `${cfg.color}14`, color: cfg.color }}>
                                  {ev.confirmation_code}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="px-8 py-3 flex justify-around" style={{ background: '#FFFFFF', borderTop: '1px solid #E2E8F4' }}>
          {[
            { emoji: '🗓️', label: 'Itinerary', active: true },
            { emoji: '📎', label: 'Docs',      active: false },
            { emoji: '⚙️', label: 'Settings',  active: false },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-0.5">
              <span className="text-base">{item.emoji}</span>
              <span className="text-xs font-medium" style={{ color: item.active ? accentColor : '#9BAAC4' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Home indicator */}
        <div className="flex justify-center py-2" style={{ background: '#FFFFFF' }}>
          <div className="w-20 h-1 rounded-full" style={{ background: '#C8D3E8' }} />
        </div>
      </div>

      <p className="text-center text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
        Trip code: <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>{trip.trip_code}</span>
      </p>
    </div>
  )
}
