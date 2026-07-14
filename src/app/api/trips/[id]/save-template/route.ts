import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description } = await req.json()

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).eq('owner_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: events } = await supabase.from('events').select('*').eq('trip_id', id).order('start_time')

  const start = new Date(trip.start_date)
  const end = new Date(trip.end_date)
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1

  const { data, error } = await supabase
    .from('trip_templates')
    .insert({
      owner_id: user.id,
      name,
      description: description || null,
      destination: trip.destination,
      duration_days: durationDays,
      color_theme: trip.color_theme,
      trip_data: {
        title: trip.title,
        destination: trip.destination,
        start_date: trip.start_date,
        end_date: trip.end_date,
        color_theme: trip.color_theme,
        notes: trip.notes,
      },
      events_data: events ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
