'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, Calendar, Clock, Phone, Globe } from 'lucide-react'
import type { Trip, TripEvent } from '@/lib/supabase/types'

const EVENT_ICONS: Record<string, string> = {
  flight: '✈️', hotel: '🏨', restaurant: '🍽️',
  activity: '🎭', transfer: '🚗', carRental: '🚙', cruise: '🛳️',
}
const EVENT_LABELS: Record<string, string> = {
  flight: 'Flight', hotel: 'Hotel', restaurant: 'Dining',
  activity: 'Activity', transfer: 'Transfer', carRental: 'Car Rental', cruise: 'Cruise',
}

type Agency = { agency_name?: string | null; brand_color?: string | null; logo_url?: string | null }

function groupByDay(events: TripEvent[]) {
  const map = new Map<string, TripEvent[]>()
  for (const ev of events) {
    const day = ev.start_time.slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(ev)
  }
  return map
}

export default function ClientPortalView({ trip, events, agency }: { trip: Trip; events: TripEvent[]; agency: Agency }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const accent = agency.brand_color ?? trip.color_theme ?? '#3D5AFE'
  const grouped = groupByDay(events)
  const start = new Date(trip.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const end = new Date(trip.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FA', fontFamily: 'system-ui, sans-serif' }}>
      {/* Hero header */}
      <div style={{ background: accent, padding: '32px 24px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
        <div style={{ position: 'relative', maxWidth: '480px', margin: '0 auto' }}>
          {agency.logo_url && (
            <img src={agency.logo_url} alt="Agency logo" style={{ height: '28px', objectFit: 'contain', marginBottom: '20px', filter: 'brightness(0) invert(1)' }} />
          )}
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
            {agency.agency_name ?? 'Itinero'} · Your Itinerary
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'white', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            {trip.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {trip.destination && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
                <MapPin style={{ width: '14px', height: '14px' }} /> {trip.destination}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.85)', fontSize: '13px' }}>
              <Calendar style={{ width: '14px', height: '14px' }} /> {start} – {end}
            </span>
          </div>
          {trip.traveler_name && (
            <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              Prepared for {trip.traveler_name}
            </p>
          )}
        </div>
      </div>

      {/* Trip code badge */}
      <div style={{ maxWidth: '480px', margin: '-20px auto 0', padding: '0 16px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9BAAC4', margin: '0 0 2px' }}>Trip Code</p>
            <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '18px', letterSpacing: '0.15em', color: accent, margin: 0 }}>{trip.trip_code}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: '#9BAAC4', margin: '0 0 2px' }}>Enter in the Itinero app</p>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#6B7A99', margin: 0 }}>for offline access</p>
          </div>
        </div>
      </div>

      {/* Day-by-day */}
      <div style={{ maxWidth: '480px', margin: '24px auto', padding: '0 16px 48px' }}>
        {Array.from(grouped.entries()).map(([day, dayEvents]) => {
          const dayDate = new Date(day + 'T12:00:00')
          return (
            <div key={day} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '14px', flexShrink: 0 }}>
                  {dayDate.getDate()}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '14px', color: '#0B1120', margin: 0 }}>
                    {dayDate.toLocaleDateString('en-US', { weekday: 'long' })}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B7A99', margin: 0 }}>
                    {dayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayEvents.map(ev => {
                  const isOpen = expanded === ev.id
                  const time = new Date(ev.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  return (
                    <div key={ev.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <button onClick={() => setExpanded(isOpen ? null : ev.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {EVENT_ICONS[ev.event_type] ?? '📍'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: '14px', color: '#0B1120', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</p>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6B7A99' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock style={{ width: '11px', height: '11px' }} />{time}</span>
                            {ev.location_name && <span style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><MapPin style={{ width: '11px', height: '11px' }} />{ev.location_name}</span>}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp style={{ width: '16px', height: '16px', color: '#9BAAC4', flexShrink: 0 }} /> : <ChevronDown style={{ width: '16px', height: '16px', color: '#9BAAC4', flexShrink: 0 }} />}
                      </button>

                      {isOpen && (
                        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F0F4FA' }}>
                          <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', marginTop: '12px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9BAAC4', margin: '0 0 8px' }}>{EVENT_LABELS[ev.event_type] ?? 'Details'}</p>
                            {ev.location_address && (
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                <MapPin style={{ width: '14px', height: '14px', color: '#9BAAC4', flexShrink: 0, marginTop: '1px' }} />
                                <a href={`https://maps.google.com/?q=${encodeURIComponent(ev.location_address)}`} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: '13px', color: accent, textDecoration: 'none' }}>{ev.location_address}</a>
                              </div>
                            )}
                            {ev.confirmation_code && (
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                <Globe style={{ width: '14px', height: '14px', color: '#9BAAC4', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', color: '#0B1120' }}>Confirmation: <strong style={{ fontFamily: 'monospace' }}>{ev.confirmation_code}</strong></span>
                              </div>
                            )}
                            {ev.notes && (
                              <p style={{ fontSize: '13px', color: '#6B7A99', margin: '8px 0 0', lineHeight: 1.5 }}>{ev.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E2E8F4' }}>
          <p style={{ fontSize: '11px', color: '#C8D3E8' }}>
            Prepared by {agency.agency_name ?? 'Itinero'} · Powered by Itinero
          </p>
        </div>
      </div>
    </div>
  )
}
