'use client'

import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { TripEvent } from '@/lib/supabase/types'

const EVENT_ICONS: Record<string, string> = {
  flight: '✈️', hotel: '🏨', restaurant: '🍽️',
  activity: '🎭', transfer: '🚗', carRental: '🚙', cruise: '🛳️',
}

function SortableRow({ event, tripId, onDelete }: { event: TripEvent; tripId: string; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: event.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  const time = new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const date = new Date(event.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div ref={setNodeRef} style={{ ...style, background: 'var(--surface)', border: '1px solid var(--border)' }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl group">
      <button {...attributes} {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-tertiary)', touchAction: 'none' }}>
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-lg shrink-0">{EVENT_ICONS[event.event_type] ?? '📍'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{event.title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {date} · {time}
          {event.location_name && <> · {event.location_name}</>}
        </p>
      </div>
      {event.confirmation_code && (
        <span className="text-xs font-mono px-2 py-0.5 rounded shrink-0"
          style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
          {event.confirmation_code}
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link href={`/dashboard/trips/${tripId}/events/${event.id}/edit`}
          className="hover-accent p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
          <Pencil className="w-3.5 h-3.5" />
        </Link>
        <button onClick={() => onDelete(event.id)}
          className="hover-danger p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function DayGroup({ date, events, tripId, onDelete }: { date: string; events: TripEvent[]; tripId: string; onDelete: (id: string) => void }) {
  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>{label}</p>
      {events.map(ev => <SortableRow key={ev.id} event={ev} tripId={tripId} onDelete={onDelete} />)}
    </div>
  )
}

export default function SortableEventList({ events, setEvents, tripId }: {
  events: TripEvent[]
  setEvents: React.Dispatch<React.SetStateAction<TripEvent[]>>
  tripId: string
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(ev: DragEndEvent) {
    const { active, over } = ev
    if (!over || active.id === over.id) return
    const oldIdx = events.findIndex(e => e.id === active.id)
    const newIdx = events.findIndex(e => e.id === over.id)
    const reordered = arrayMove(events, oldIdx, newIdx)
    setEvents(reordered)
    await fetch(`/api/trips/${tripId}/reorder-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((e, i) => ({ id: e.id, sort_order: i })) }),
    })
  }

  async function handleDelete(eventId: string) {
    await fetch(`/api/trips/${tripId}/events/${eventId}`, { method: 'DELETE' })
    setEvents(es => es.filter(e => e.id !== eventId))
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No events yet — add one to get started</p>
      </div>
    )
  }

  // Group by date, sorted chronologically
  const sorted = [...events].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const byDay = new Map<string, TripEvent[]>()
  for (const ev of sorted) {
    const day = ev.start_time.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(ev)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map(e => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6">
          {Array.from(byDay.entries()).map(([day, dayEvents]) => (
            <DayGroup key={day} date={day} events={dayEvents} tripId={tripId} onDelete={handleDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
