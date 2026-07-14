'use client'

import { useState } from 'react'
import type { Trip, TripEvent } from '@/lib/supabase/types'

const EVENT_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  flight:     { emoji: '✈️', color: '#3D5AFE', bg: '#EEF1FF' },
  hotel:      { emoji: '🏨', color: '#059669', bg: '#ECFDF5' },
  restaurant: { emoji: '🍽️', color: '#F97316', bg: '#FFF7ED' },
  activity:   { emoji: '🎭', color: '#7C3AED', bg: '#F5F3FF' },
  transfer:   { emoji: '🚗', color: '#0EA5E9', bg: '#F0F9FF' },
  carRental:  { emoji: '🚙', color: '#6B7A99', bg: '#F1F5F9' },
  cruise:     { emoji: '🛳️', color: '#E11D48', bg: '#FFF1F2' },
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

export default function PublicTripView({ trip, events }: { trip: Trip; events: TripEvent[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const grouped = groupByDay(events)
  const accent = trip.color_theme || '#3D5AFE'

  const start = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const end   = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen" style={{ background: '#F0F4FA' }}>
      {/* Header */}
      <div className="px-6 pt-10 pb-8" style={{ background: accent }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="text-white text-xs font-bold">✈</span>
            </div>
            <span className="text-white text-sm font-bold opacity-80 tracking-tight">Itinero</span>
          </div>
          {trip.traveler_name && (
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em' }}>
              {trip.traveler_name}&rsquo;s itinerary
            </p>
          )}
          <h1 className="text-3xl font-bold text-white mb-1" style={{ letterSpacing: '-0.02em' }}>{trip.title}</h1>
          {trip.destination && (
            <p className="text-sm text-white opacity-70 mb-1">📍 {trip.destination}</p>
          )}
          <p className="text-sm text-white opacity-70">{start} – {end}</p>

          <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <span className="text-white text-xs opacity-70">Trip code</span>
            <span className="font-mono font-bold text-white text-sm tracking-widest">{trip.trip_code}</span>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🗓️</p>
            <p className="text-sm" style={{ color: '#6B7A99' }}>No events added yet</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([day, dayEvents]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ background: accent }}>
                  {new Date(day + 'T12:00:00').getDate()}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0B1120' }}>
                    {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs" style={{ color: '#9BAAC4' }}>{dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}</p>
                </div>
              </div>

              <div className="space-y-2 ml-11">
                {dayEvents.map(ev => {
                  const cfg = EVENT_CONFIG[ev.event_type ?? ''] ?? { emoji: '📍', color: '#6B7A99', bg: '#F1F5F9' }
                  const time = new Date(ev.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  const endTime = ev.end_time ? new Date(ev.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
                  const isOpen = expanded === ev.id

                  return (
                    <div key={ev.id} className="rounded-2xl overflow-hidden cursor-pointer"
                      style={{ background: '#FFFFFF', border: '1px solid #E2E8F4' }}
                      onClick={() => setExpanded(isOpen ? null : ev.id)}>
                      <div className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg"
                          style={{ background: cfg.bg }}>
                          {cfg.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm" style={{ color: '#0B1120' }}>{ev.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#6B7A99' }}>
                            {time}{endTime ? ` – ${endTime}` : ''}
                            {ev.location_name ? ` · ${ev.location_name}` : ''}
                          </p>
                        </div>
                        {ev.confirmation_code && (
                          <span className="font-mono text-xs font-bold px-2 py-1 rounded-lg shrink-0"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {ev.confirmation_code}
                          </span>
                        )}
                        <span className="text-xs shrink-0" style={{ color: '#9BAAC4' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>

                      {isOpen && (
                        <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: '#E2E8F4' }}>
                          {ev.location_address && (
                            <DetailRow label="Address" value={ev.location_address} link={`https://maps.google.com/?q=${encodeURIComponent(ev.location_address)}`} />
                          )}
                          {ev.notes && (
                            <DetailRow label="Notes" value={ev.notes} />
                          )}
                          {ev.metadata && Object.entries(ev.metadata).map(([k, v]) => (
                            <DetailRow key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {trip.notes && (
          <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid #E2E8F4' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#9BAAC4', letterSpacing: '0.1em' }}>Notes from your agent</p>
            <p className="text-sm whitespace-pre-wrap" style={{ color: '#6B7A99' }}>{trip.notes}</p>
          </div>
        )}

        <p className="text-center text-xs pb-8" style={{ color: '#C8D3E8' }}>
          Powered by Itinero · Download the app for offline access
        </p>
      </div>
    </div>
  )
}

function DetailRow({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <p className="text-xs font-semibold shrink-0 w-24 capitalize" style={{ color: '#9BAAC4' }}>{label}</p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: '#3D5AFE' }}>{value}</a>
      ) : (
        <p className="text-xs" style={{ color: '#0B1120' }}>{value}</p>
      )}
    </div>
  )
}
