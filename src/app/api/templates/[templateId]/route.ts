import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('trip_templates')
    .delete()
    .eq('id', templateId)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

// Use a template to create a new trip
export async function POST(req: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { start_date, traveler_name, traveler_email } = await req.json()

  const { data: template } = await supabase
    .from('trip_templates')
    .select('*')
    .eq('id', templateId)
    .eq('owner_id', user.id)
    .single()

  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const tripData = template.trip_data as Record<string, unknown>
  const durationDays = (template.duration_days ?? 7) - 1
  const startDate = new Date(start_date)
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + durationDays)

  const tripCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      owner_id: user.id,
      title: tripData.title as string,
      destination: tripData.destination as string,
      color_theme: template.color_theme,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      traveler_name: traveler_name || null,
      traveler_email: traveler_email || null,
      trip_code: tripCode,
    })
    .select()
    .single()

  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 })

  // Insert events offset by start_date
  const eventsData = template.events_data as Array<Record<string, unknown>>
  if (eventsData.length > 0) {
    const templateStart = new Date(tripData.start_date as string)
    await supabase.from('events').insert(
      eventsData.map(({ id: _id, created_at: _c, updated_at: _u, trip_id: _t, ...ev }) => {
        const offset = new Date(ev.start_time as string).getTime() - templateStart.getTime()
        const newStart = new Date(startDate.getTime() + offset)
        const endOffset = ev.end_time ? new Date(ev.end_time as string).getTime() - templateStart.getTime() : null
        return {
          ...ev,
          trip_id: trip.id,
          start_time: newStart.toISOString(),
          end_time: endOffset ? new Date(startDate.getTime() + endOffset).toISOString() : null,
        }
      })
    )
  }

  return NextResponse.json({ id: trip.id }, { status: 201 })
}
