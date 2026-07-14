import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destination, start_date, end_date, existing_events, prompt } = await req.json()

  const userPrompt = `You are a travel planner. The user is planning a trip to ${destination ?? 'an unspecified destination'} from ${start_date} to ${end_date}.
${existing_events?.length ? `Already on the itinerary:\n${existing_events.map((e: { title: string; location_name?: string; start_time: string }) => `- ${e.title}${e.location_name ? ` at ${e.location_name}` : ''} (${e.start_time})`).join('\n')}` : ''}

User request: "${prompt}"

Rules:
- All event dates MUST be between ${start_date} and ${end_date} inclusive.
- Pick realistic times of day based on event type:
  * breakfast/brunch: 07:00–09:30
  * lunch: 12:00–13:00
  * dinner: 18:30–20:00
  * morning activity: 09:00–11:00
  * afternoon activity: 14:00–17:00
  * hotel check-in: 15:00
  * hotel check-out: 11:00
  * flights: use realistic departure times
  * transfers/car rental: match the activity they support
- end_time should be realistic (e.g. dinner = 2 hours, activity = 1.5-3 hours, hotel = same day midnight)
- Do NOT use 00:00, 03:00, or other implausible times unless it is a red-eye flight.

Respond with ONLY a valid JSON array (no markdown, no explanation, no trailing commas) like this:
[{"event_type":"restaurant","title":"Dinner at Le Bernardin","start_time":"${start_date}T19:00:00","end_time":"${start_date}T21:00:00","location_name":"Le Bernardin","location_address":"155 W 51st St, New York, NY 10019","notes":"Michelin-starred seafood restaurant, smart casual dress code","confirmation_code":null}]

event_type must be one of: flight, hotel, restaurant, activity, transfer, carRental, cruise
Return 1-6 events. Pure JSON array only.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  // Extract JSON array from response
  const arrayMatch = text.match(/\[[\s\S]*\]/)
  if (!arrayMatch) return NextResponse.json({ events: [] })

  try {
    const events = JSON.parse(arrayMatch[0])
    if (!Array.isArray(events)) return NextResponse.json({ events: [] })
    return NextResponse.json({ events: events.map(fixEventTime) })
  } catch {
    return NextResponse.json({ events: [] })
  }
}

// Sensible default time windows by event type and title keywords
const TIME_RULES: { match: (e: { event_type: string; title: string }) => boolean; start: string; durationHours: number }[] = [
  { match: e => /breakfast|brunch/i.test(e.title),                           start: '08:00', durationHours: 1 },
  { match: e => /lunch/i.test(e.title),                                      start: '12:30', durationHours: 1.5 },
  { match: e => /dinner|supper/i.test(e.title),                              start: '19:00', durationHours: 2 },
  { match: e => e.event_type === 'restaurant' && /morning/i.test(e.title),   start: '08:00', durationHours: 1 },
  { match: e => e.event_type === 'restaurant',                               start: '19:00', durationHours: 2 },
  { match: e => e.event_type === 'hotel' && /check.?out/i.test(e.title),     start: '11:00', durationHours: 0.5 },
  { match: e => e.event_type === 'hotel',                                    start: '15:00', durationHours: 0.5 },
  { match: e => e.event_type === 'activity' && /morning/i.test(e.title),     start: '09:30', durationHours: 2 },
  { match: e => e.event_type === 'activity' && /afternoon/i.test(e.title),   start: '14:00', durationHours: 2.5 },
  { match: e => e.event_type === 'activity' && /evening|night/i.test(e.title), start: '19:00', durationHours: 2 },
  { match: e => e.event_type === 'activity',                                 start: '10:00', durationHours: 2 },
  { match: e => e.event_type === 'transfer',                                 start: '09:00', durationHours: 1 },
  { match: e => e.event_type === 'carRental',                                start: '10:00', durationHours: 0.5 },
]

function fixEventTime(ev: { event_type: string; title: string; start_time: string; end_time?: string }) {
  const date = (ev.start_time ?? '').slice(0, 10)
  if (!date) return ev

  // Flights keep whatever time the AI chose
  if (ev.event_type === 'flight') return ev

  // Always override with rule-based times — don't trust the model for this
  const rule = TIME_RULES.find(r => r.match(ev))
  if (!rule) return ev

  const [sh, sm] = rule.start.split(':').map(Number)
  const startMs = sh * 60 + sm
  const endMs = startMs + rule.durationHours * 60
  const endH = String(Math.floor(endMs / 60) % 24).padStart(2, '0')
  const endM = String(endMs % 60).padStart(2, '0')

  return {
    ...ev,
    start_time: `${date}T${rule.start}:00`,
    end_time: `${date}T${endH}:${endM}:00`,
  }
}
