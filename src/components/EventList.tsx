'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Pencil, Trash2, Plane, BedDouble, UtensilsCrossed, PersonStanding, Car, Ship } from 'lucide-react'
import type { TripEvent, EventType } from '@/lib/supabase/types'

const EVENT_CONFIG: Record<EventType, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  flight:     { icon: <Plane className="w-3.5 h-3.5" />,             color: '#2563EB', bg: '#EFF6FF', label: 'Flight' },
  hotel:      { icon: <BedDouble className="w-3.5 h-3.5" />,         color: '#7C3AED', bg: '#F5F3FF', label: 'Hotel' },
  restaurant: { icon: <UtensilsCrossed className="w-3.5 h-3.5" />,   color: '#EA580C', bg: '#FFF7ED', label: 'Dining' },
  activity:   { icon: <PersonStanding className="w-3.5 h-3.5" />,    color: '#059669', bg: '#ECFDF5', label: 'Activity' },
  transfer:   { icon: <Car className="w-3.5 h-3.5" />,               color: '#0891B2', bg: '#ECFEFF', label: 'Transfer' },
  carRental:  { icon: <Car className="w-3.5 h-3.5" />,               color: '#4338CA', bg: '#EEF2FF', label: 'Car Rental' },
  cruise:     { icon: <Ship className="w-3.5 h-3.5" />,              color: '#0369A1', bg: '#F0F9FF', label: 'Cruise' },
}

export default function EventList({ events, tripId }: { events: TripEvent[]; tripId: string }) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function deleteEvent(eventId: string) {
    setDeletingId(eventId)
    await fetch(`/api/trips/${tripId}/events/${eventId}`, { method: 'DELETE' })
    router.refresh()
    setDeletingId(null)
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl py-14 text-center" style={{ border: '2px dashed var(--border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>No events yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Add flights, hotels, restaurants and more</p>
      </div>
    )
  }

  // Group by day
  const grouped = events.reduce<Record<string, TripEvent[]>>((acc, event) => {
    const day = new Date(event.start_time).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    })
    if (!acc[day]) acc[day] = []
    acc[day].push(event)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <div key={day}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
            {day}
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {dayEvents.map((event, i) => {
              const cfg = EVENT_CONFIG[event.event_type]
              return (
                <div key={event.id}
                  className="hover-bg flex items-center gap-3.5 px-4 py-3.5 transition-colors"
                  style={{
                    background: 'var(--surface)',
                    borderBottom: i === dayEvents.length - 1 ? 'none' : '1px solid var(--border)',
                  }}>

                  <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.icon}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {event.title}
                      </span>
                      <span className="text-xs shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      {event.end_time && ` – ${new Date(event.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                      {event.location_name && ` · ${event.location_name}`}
                      {event.confirmation_code && (
                        <span className="font-mono ml-1" style={{ color: 'var(--text-tertiary)' }}>
                          #{event.confirmation_code}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/dashboard/trips/${tripId}/events/${event.id}/edit`}
                      className="hover-accent p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => deleteEvent(event.id)} disabled={deletingId === event.id}
                      className="hover-danger p-1.5 rounded-lg transition-colors disabled:opacity-40"
                      style={{ color: 'var(--text-tertiary)' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
