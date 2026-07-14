'use client'

import { useEffect } from 'react'
import type { Trip, TripEvent } from '@/lib/supabase/types'

const EVENT_ICONS: Record<string, string> = {
  flight: '✈️', hotel: '🏨', restaurant: '🍽️',
  activity: '🎭', transfer: '🚗', carRental: '🚙', cruise: '🛳️',
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

export default function PrintView({ trip, events }: { trip: Trip; events: TripEvent[] }) {
  useEffect(() => { window.print() }, [])

  const grouped = groupByDay(events)
  const accent = trip.color_theme || '#3D5AFE'
  const start = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const end = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 1cm 1.5cm; size: A4; }
        }
        body { font-family: 'Inter', system-ui, sans-serif; color: #0B1120; background: white; }
      `}</style>

      {/* Print button — hidden when printing */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.print()}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg"
          style={{ background: accent }}>
          Print / Save PDF
        </button>
        <button onClick={() => window.history.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white shadow-lg border"
          style={{ borderColor: '#E2E8F4', color: '#6B7A99' }}>
          ← Back
        </button>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2cm 0' }}>
        {/* Header */}
        <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: '16px', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9BAAC4', marginBottom: '6px' }}>
            Itinerary
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#0B1120' }}>
            {trip.title}
          </h1>
          <div style={{ display: 'flex', gap: '20px', marginTop: '8px', fontSize: '13px', color: '#6B7A99' }}>
            {trip.destination && <span>📍 {trip.destination}</span>}
            <span>🗓️ {start} – {end}</span>
            {trip.traveler_name && <span>👤 {trip.traveler_name}</span>}
          </div>
          {trip.trip_code && (
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '11px', background: '#EEF1FF', color: '#2341D4', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.1em' }}>
                {trip.trip_code}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {trip.notes && (
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F4', borderRadius: '8px', padding: '12px 16px', marginBottom: '28px', fontSize: '13px', color: '#6B7A99' }}>
            <strong style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9BAAC4', marginBottom: '4px' }}>Notes</strong>
            {trip.notes}
          </div>
        )}

        {/* Days */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {Array.from(grouped.entries()).map(([day, dayEvents]) => (
            <div key={day} style={{ pageBreakInside: 'avoid' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `2px solid ${accent}20` }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 800, flexShrink: 0 }}>
                  {new Date(day + 'T12:00:00').getDate()}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0B1120' }}>
                  {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayEvents.map(ev => {
                  const time = new Date(ev.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  const endTime = ev.end_time ? new Date(ev.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null
                  return (
                    <div key={ev.id} style={{ display: 'flex', gap: '12px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', borderLeft: `3px solid ${accent}` }}>
                      <span style={{ fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>{EVENT_ICONS[ev.event_type ?? ''] ?? '📍'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: '#0B1120' }}>{ev.title}</p>
                          <p style={{ fontSize: '12px', color: '#6B7A99', margin: 0, flexShrink: 0, marginLeft: '12px' }}>
                            {time}{endTime ? ` – ${endTime}` : ''}
                          </p>
                        </div>
                        {ev.location_name && <p style={{ fontSize: '12px', color: '#6B7A99', margin: '2px 0 0' }}>📍 {ev.location_name}</p>}
                        {ev.location_address && <p style={{ fontSize: '11px', color: '#9BAAC4', margin: '1px 0 0' }}>{ev.location_address}</p>}
                        {ev.confirmation_code && (
                          <p style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#2341D4', margin: '4px 0 0' }}>
                            Conf: {ev.confirmation_code}
                          </p>
                        )}
                        {ev.notes && <p style={{ fontSize: '11px', color: '#9BAAC4', margin: '4px 0 0', fontStyle: 'italic' }}>{ev.notes}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '16px', borderTop: '1px solid #E2E8F4', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#C8D3E8' }}>
          <span>Powered by Itinero</span>
          <span>Trip code: {trip.trip_code}</span>
        </div>
      </div>
    </>
  )
}
