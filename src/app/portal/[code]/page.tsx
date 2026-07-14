import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Trip, TripEvent } from '@/lib/supabase/types'
import ClientPortalView from '@/components/ClientPortalView'

export default async function PortalPage({ params }: { params: Promise<{ code: string }> }) {
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
    .order('sort_order', { ascending: true })
    .order('start_time', { ascending: true })

  const { data: agency } = await supabase
    .from('agency_settings')
    .select('agency_name, brand_color, logo_url')
    .eq('owner_id', trip.owner_id)
    .single()

  return (
    <ClientPortalView
      trip={trip as Trip}
      events={(events as TripEvent[]) ?? []}
      agency={agency ?? {}}
    />
  )
}
