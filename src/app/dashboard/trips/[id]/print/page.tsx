import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Trip, TripEvent } from '@/lib/supabase/types'
import PrintView from '@/components/PrintView'

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).eq('owner_id', user!.id).single()
  if (!trip) notFound()

  const { data: events } = await supabase.from('events').select('*').eq('trip_id', id).order('start_time', { ascending: true })

  return <PrintView trip={trip as Trip} events={(events as TripEvent[]) ?? []} />
}
