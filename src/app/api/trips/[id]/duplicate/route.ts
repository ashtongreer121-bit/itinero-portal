import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).eq('owner_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { data: newTrip, error } = await supabase
    .from('trips')
    .insert({
      owner_id: user.id,
      title: `${trip.title} (copy)`,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      color_theme: trip.color_theme,
      traveler_name: trip.traveler_name,
      traveler_email: trip.traveler_email,
      notes: trip.notes,
      trip_code: newCode,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Copy events
  const { data: events } = await supabase.from('events').select('*').eq('trip_id', id)
  if (events && events.length > 0) {
    await supabase.from('events').insert(
      events.map(({ id: _id, created_at: _c, updated_at: _u, ...e }) => ({ ...e, trip_id: newTrip.id }))
    )
  }

  return NextResponse.json({ id: newTrip.id }, { status: 201 })
}
