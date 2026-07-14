'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TripEvent, EventType } from '@/lib/supabase/types'

const EVENT_TYPES: { value: EventType; label: string; emoji: string }[] = [
  { value: 'flight', label: 'Flight', emoji: '✈️' },
  { value: 'hotel', label: 'Hotel', emoji: '🏨' },
  { value: 'restaurant', label: 'Dining', emoji: '🍽️' },
  { value: 'activity', label: 'Activity', emoji: '🎭' },
  { value: 'transfer', label: 'Transfer', emoji: '🚗' },
  { value: 'carRental', label: 'Car Rental', emoji: '🚙' },
  { value: 'cruise', label: 'Cruise', emoji: '🛳️' },
]

const METADATA_FIELDS: Record<EventType, { key: string; label: string; placeholder?: string }[]> = {
  flight: [
    { key: 'flightNumber', label: 'Flight Number', placeholder: 'AA123' },
    { key: 'airline', label: 'Airline', placeholder: 'American Airlines' },
    { key: 'departureAirport', label: 'Departure Airport', placeholder: 'JFK' },
    { key: 'arrivalAirport', label: 'Arrival Airport', placeholder: 'CDG' },
    { key: 'terminal', label: 'Terminal', placeholder: 'T4' },
    { key: 'gate', label: 'Gate', placeholder: 'B22' },
    { key: 'seat', label: 'Seat', placeholder: '14A' },
    { key: 'aircraft', label: 'Aircraft', placeholder: 'Boeing 777' },
  ],
  hotel: [
    { key: 'hotelChain', label: 'Brand / Chain', placeholder: 'Marriott' },
    { key: 'roomType', label: 'Room Type', placeholder: 'Deluxe King' },
    { key: 'roomNumber', label: 'Room Number', placeholder: '412' },
    { key: 'checkInTime', label: 'Check-in Time', placeholder: '3:00 PM' },
    { key: 'checkOutTime', label: 'Check-out Time', placeholder: '11:00 AM' },
    { key: 'amenities', label: 'Amenities', placeholder: 'Pool, Spa, Breakfast included' },
  ],
  restaurant: [
    { key: 'reservationName', label: 'Reservation Name', placeholder: 'Smith party' },
    { key: 'partySize', label: 'Party Size', placeholder: '2' },
    { key: 'dressCode', label: 'Dress Code', placeholder: 'Smart casual' },
    { key: 'cuisine', label: 'Cuisine', placeholder: 'French' },
  ],
  activity: [],
  transfer: [
    { key: 'vehicleType', label: 'Vehicle Type', placeholder: 'Sedan' },
    { key: 'driverName', label: 'Driver Name', placeholder: 'Jean-Pierre' },
    { key: 'driverPhone', label: 'Driver Phone', placeholder: '+33 6 12 34 56 78' },
    { key: 'vehiclePlate', label: 'Plate Number', placeholder: 'AB-123-CD' },
    { key: 'pickupInstructions', label: 'Pickup Instructions', placeholder: 'Meet at Arrivals Hall B' },
  ],
  carRental: [
    { key: 'rentalCompany', label: 'Rental Company', placeholder: 'Hertz' },
    { key: 'carClass', label: 'Car Class', placeholder: 'Compact SUV' },
    { key: 'pickupLocation', label: 'Pickup Location', placeholder: 'Airport Terminal 2' },
    { key: 'dropoffLocation', label: 'Drop-off Location', placeholder: 'City Centre Office' },
  ],
  cruise: [
    { key: 'shipName', label: 'Ship Name', placeholder: 'Celebrity Apex' },
    { key: 'deckCabin', label: 'Deck / Cabin', placeholder: 'Deck 8, Cabin 8102' },
    { key: 'boardingTime', label: 'Boarding Time', placeholder: '12:00 PM' },
  ],
}

const DEFAULT_NOTIFY: Record<EventType, number> = {
  flight: 180, hotel: 60, restaurant: 30, activity: 60, transfer: 30, carRental: 60, cruise: 240,
}

function toLocalDatetimeString(isoString: string) {
  // Convert ISO to local datetime-local value
  const d = new Date(isoString)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function toISOString(localString: string) {
  return new Date(localString).toISOString()
}

export default function EventForm({ tripId, event }: { tripId: string; event?: TripEvent }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [eventType, setEventType] = useState<EventType>(event?.event_type ?? 'flight')
  const [form, setForm] = useState({
    title: event?.title ?? '',
    start_time: event?.start_time ? toLocalDatetimeString(event.start_time) : '',
    end_time: event?.end_time ? toLocalDatetimeString(event.end_time) : '',
    location_name: event?.location_name ?? '',
    location_address: event?.location_address ?? '',
    confirmation_code: event?.confirmation_code ?? '',
    notes: event?.notes ?? '',
    notify_minutes_before: event?.notify_minutes_before?.toString() ?? '',
  })
  const [metadata, setMetadata] = useState<Record<string, string>>(event?.metadata ?? {})

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setMeta(key: string, value: string) {
    setMetadata(m => ({ ...m, [key]: value }))
  }

  function handleTypeChange(type: EventType) {
    setEventType(type)
    // Pre-fill title if empty
    if (!form.title) {
      const label = EVENT_TYPES.find(t => t.value === type)?.label ?? ''
      setForm(f => ({ ...f, title: label }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Filter out empty metadata values
    const cleanMeta = Object.fromEntries(Object.entries(metadata).filter(([, v]) => v.trim()))

    const payload = {
      event_type: eventType,
      title: form.title,
      start_time: toISOString(form.start_time),
      end_time: form.end_time ? toISOString(form.end_time) : null,
      location_name: form.location_name || null,
      location_address: form.location_address || null,
      confirmation_code: form.confirmation_code || null,
      notes: form.notes || null,
      notify_minutes_before: form.notify_minutes_before ? parseInt(form.notify_minutes_before) : DEFAULT_NOTIFY[eventType],
      metadata: Object.keys(cleanMeta).length > 0 ? cleanMeta : null,
    }

    const url = event
      ? `/api/trips/${tripId}/events/${event.id}`
      : `/api/trips/${tripId}/events`
    const method = event ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      const { error } = await res.json()
      setError(error)
      setLoading(false)
      return
    }

    router.push(`/dashboard/trips/${tripId}`)
    router.refresh()
  }

  const metaFields = METADATA_FIELDS[eventType]
  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Event Type */}
      <div className="rounded-xl p-6 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          Event Type
        </p>
        <div className="grid grid-cols-4 gap-2">
          {EVENT_TYPES.map(t => (
            <button key={t.value} type="button" onClick={() => handleTypeChange(t.value)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-colors"
              style={{
                border: `1px solid ${eventType === t.value ? 'var(--accent)' : 'var(--border)'}`,
                background: eventType === t.value ? 'var(--accent-light)' : 'var(--bg)',
                color: eventType === t.value ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}>
              <span className="text-base">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Core fields */}
      <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          Details
        </p>
        <EField label="Title" required>
          <input required value={form.title} onChange={e => set('title', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="e.g. Flight to Paris" />
        </EField>
        <div className="grid grid-cols-2 gap-4">
          <EField label="Start Time" required>
            <input type="datetime-local" required value={form.start_time} onChange={e => set('start_time', e.target.value)}
              className={inputCls} style={inputStyle} />
          </EField>
          <EField label="End Time">
            <input type="datetime-local" value={form.end_time} min={form.start_time} onChange={e => set('end_time', e.target.value)}
              className={inputCls} style={inputStyle} />
          </EField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <EField label="Location Name">
            <input value={form.location_name} onChange={e => set('location_name', e.target.value)}
              className={inputCls} style={inputStyle} placeholder="e.g. CDG Airport" />
          </EField>
          <EField label="Confirmation Code">
            <input value={form.confirmation_code} onChange={e => set('confirmation_code', e.target.value.toUpperCase())}
              className={`${inputCls} font-mono`} style={inputStyle} placeholder="e.g. XK7F2P" />
          </EField>
        </div>
        <EField label="Address">
          <input value={form.location_address} onChange={e => set('location_address', e.target.value)}
            className={inputCls} style={inputStyle} placeholder="Full address for maps" />
        </EField>
        <div className="grid grid-cols-2 gap-4">
          <EField label={`Notify Before (min) — default ${DEFAULT_NOTIFY[eventType]}`}>
            <input type="number" min={0} value={form.notify_minutes_before} onChange={e => set('notify_minutes_before', e.target.value)}
              className={inputCls} style={inputStyle} placeholder={String(DEFAULT_NOTIFY[eventType])} />
          </EField>
        </div>
        <EField label="Notes">
          <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
            className={`${inputCls} resize-none`} style={inputStyle} placeholder="Visible to the traveler in the app…" />
        </EField>
      </div>

      {/* Type-specific metadata */}
      {metaFields.length > 0 && (
        <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
            {EVENT_TYPES.find(t => t.value === eventType)?.label} Details
          </p>
          <div className="grid grid-cols-2 gap-4">
            {metaFields.map(field => (
              <EField key={field.key} label={field.label}>
                <input value={metadata[field.key] ?? ''} onChange={e => setMeta(field.key, e.target.value)}
                  className={inputCls} style={inputStyle} placeholder={field.placeholder} />
              </EField>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg px-4 py-3 text-xs" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>{error}</div>
      )}

      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)' }}>
          {loading ? 'Saving…' : event ? 'Save Changes' : 'Add Event'}
        </button>
      </div>
    </form>
  )
}

function EField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span style={{ color: 'var(--accent)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}
