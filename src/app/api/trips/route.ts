import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function generateTripCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const trip_code = generateTripCode()

  const { data, error } = await supabase
    .from('trips')
    .insert({ ...body, owner_id: user.id, trip_code })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
