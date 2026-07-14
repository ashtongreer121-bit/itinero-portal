import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('trip_reminders').select('*').eq('trip_id', id).eq('owner_id', user.id).order('send_at')
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('trip_reminders')
    .insert({ ...body, trip_id: id, owner_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reminderId } = await req.json()
  await supabase.from('trip_reminders').delete().eq('id', reminderId).eq('trip_id', id).eq('owner_id', user.id)
  return NextResponse.json({ ok: true })
}

// Called by cron or manually to flush pending reminders
export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date().toISOString()
  const { data: due } = await supabase
    .from('trip_reminders')
    .select('*')
    .eq('trip_id', id)
    .eq('owner_id', user.id)
    .eq('status', 'pending')
    .lte('send_at', now)

  if (!due?.length) return NextResponse.json({ sent: 0 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data: settings } = await supabase.from('agency_settings').select('*').eq('owner_id', user.id).single()
  const fromName = settings?.email_from_name ?? settings?.agency_name ?? 'Itinero Agency'

  let sent = 0
  for (const r of due) {
    const { error } = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [r.recipient_email],
      subject: r.subject,
      html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0B1120"><div style="white-space:pre-wrap;font-size:14px;line-height:1.7">${r.body}</div><p style="font-size:11px;color:#C8D3E8;margin-top:32px;border-top:1px solid #E2E8F4;padding-top:16px;text-align:center">Sent by ${fromName} via Itinero</p></div>`,
    })
    if (!error) {
      await supabase.from('trip_reminders').update({ status: 'sent', sent_at: now }).eq('id', r.id)
      sent++
    }
  }

  return NextResponse.json({ sent })
}
