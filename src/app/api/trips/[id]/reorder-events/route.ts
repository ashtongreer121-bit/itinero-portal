import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trip } = await supabase.from('trips').select('id').eq('id', id).eq('owner_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { order } = await req.json() as { order: { id: string; sort_order: number }[] }

  for (const { id: eventId, sort_order } of order) {
    await supabase.from('events').update({ sort_order }).eq('id', eventId).eq('trip_id', id)
  }

  return NextResponse.json({ ok: true })
}
