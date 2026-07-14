'use client'

import { useState } from 'react'
import { Plus, Mail } from 'lucide-react'
import Link from 'next/link'
import type { Trip, TripEvent } from '@/lib/supabase/types'
import dynamic from 'next/dynamic'
const SortableEventList = dynamic(() => import('./SortableEventList'), { ssr: false })
import AIAssistPanel from './AIAssistPanel'
import SendItineraryModal from './SendItineraryModal'
import CollaboratorsPanel from './CollaboratorsPanel'

export default function TripDetailClient({ trip, initialEvents, tripId }: {
  trip: Trip
  initialEvents: TripEvent[]
  tripId: string
}) {
  const [events, setEvents] = useState(initialEvents)
  const [showSendModal, setShowSendModal] = useState(false)

  return (
    <>
      <div className="col-span-2 space-y-4">
        {/* Events header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Events</h2>
            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>
              {events.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {trip.traveler_email && (
              <button onClick={() => setShowSendModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <Mail className="w-3 h-3" /> Send Email
              </button>
            )}
            <Link href={`/dashboard/trips/${tripId}/events/new`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'var(--accent)' }}>
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add Event
            </Link>
          </div>
        </div>

        {/* Drag-and-drop event list */}
        <SortableEventList events={events} setEvents={setEvents} tripId={tripId} />

        {/* AI Assist */}
        <AIAssistPanel
          trip={trip}
          existingEvents={events}
          onEventsAdded={added => setEvents(es => [...es, ...added].sort((a, b) => a.start_time.localeCompare(b.start_time)))}
        />

        {/* Collaborators */}
        <CollaboratorsPanel tripId={tripId} />
      </div>

      {/* Send email modal */}
      {showSendModal && (
        <SendItineraryModal
          trip={trip}
          events={events}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </>
  )
}
