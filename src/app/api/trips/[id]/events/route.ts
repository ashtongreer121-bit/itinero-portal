import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // verify trip ownership
  const { data: trip } = await supabase.from('trips').select('id').eq('id', id).eq('owner_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { data, error } = await supabase
    .from('events')
    .insert({ ...body, trip_id: id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
