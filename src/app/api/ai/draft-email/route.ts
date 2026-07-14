import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { trip, events, tone = 'professional' } = await req.json()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Write a ${tone} email to ${trip.traveler_name ?? 'the traveler'} sharing their itinerary for "${trip.title}" to ${trip.destination ?? 'their destination'}.

Trip dates: ${trip.start_date} to ${trip.end_date}
Trip code: ${trip.trip_code}
Key events: ${events.slice(0, 6).map((e: { title: string }) => e.title).join(', ')}

The email should:
- Welcome them and express excitement about the trip
- Mention the Itinero app and their trip code (${trip.trip_code}) for offline access
- Briefly highlight 2-3 key moments from the itinerary
- Close warmly with contact info placeholder

Return only the email body text, no subject line.`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ draft: text, subject: `Your ${trip.title} Itinerary is Ready! ✈️` })
}
