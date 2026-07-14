import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EventForm from '@/components/EventForm'

export default async function NewEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase
    .from('trips')
    .select('id, title')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!trip) notFound()

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/dashboard/trips/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Event</h1>
      </div>
      <EventForm tripId={id} />
    </div>
  )
}
