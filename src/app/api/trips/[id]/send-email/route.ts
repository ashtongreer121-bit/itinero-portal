import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).eq('owner_id', user.id).single()
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { subject, body, to } = await req.json()

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { data: settings } = await supabase.from('agency_settings').select('*').eq('owner_id', user.id).single()
  const fromName = settings?.email_from_name ?? settings?.agency_name ?? 'Itinero Agency'

  const { error } = await resend.emails.send({
    from: `${fromName} <onboarding@resend.dev>`,
    to: [to],
    subject,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0B1120">
      <div style="border-left:4px solid ${settings?.brand_color ?? '#3D5AFE'};padding-left:16px;margin-bottom:24px">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9BAAC4;margin:0 0 4px">Itinerary</p>
        <h1 style="font-size:22px;font-weight:800;margin:0;color:#0B1120">${trip.title}</h1>
        <p style="font-size:13px;color:#6B7A99;margin:4px 0 0">${trip.destination ?? ''}</p>
      </div>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#2D3748;margin-bottom:32px">${body}</div>
      <div style="background:#EEF1FF;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px">
        <p style="font-size:11px;color:#6B7A99;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em">Your Trip Code</p>
        <p style="font-size:24px;font-weight:800;letter-spacing:0.2em;color:#2341D4;margin:0;font-family:monospace">${trip.trip_code}</p>
        <p style="font-size:12px;color:#6B7A99;margin:8px 0 0">Enter this in the Itinero app to access your itinerary offline</p>
      </div>
      <p style="font-size:12px;color:#9BAAC4;border-top:1px solid #E2E8F4;padding-top:16px;text-align:center">Powered by Itinero · ${fromName}</p>
    </div>`,
  })

  if (error) return NextResponse.json({ error: (error as { message?: string }).message ?? 'Send failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
