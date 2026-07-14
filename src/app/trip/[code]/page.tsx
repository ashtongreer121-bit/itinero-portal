import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Trip, TripEvent } from '@/lib/supabase/types'
import PublicTripView from '@/components/PublicTripView'

export default async function PublicTripPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()

  const { data: trip } = await supabase
    .from('trips')
    .select('*')
    .eq('trip_code', code.toUpperCase())
    .single()

  if (!trip) notFound()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('trip_id', trip.id)
    .order('start_time', { ascending: true })

  return <PublicTripView trip={trip as Trip} events={(events as TripEvent[]) ?? []} />
}
