import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EventForm from '@/components/EventForm'
import type { TripEvent } from '@/lib/supabase/types'

export default async function EditEventPage({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()
  if (!trip) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('trip_id', id)
    .single()
  if (!event) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/trips/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
      </div>
      <EventForm tripId={id} event={event as TripEvent} />
    </div>
  )
}
