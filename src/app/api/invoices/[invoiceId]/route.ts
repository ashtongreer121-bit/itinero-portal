import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('invoices')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('invoices').delete().eq('id', invoiceId).eq('owner_id', user.id)
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { to } = await req.json()
  const { data: invoice } = await supabase.from('invoices').select('*, trips(title), clients(name)').eq('id', invoiceId).eq('owner_id', user.id).single()
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: settings } = await supabase.from('agency_settings').select('*').eq('owner_id', user.id).single()
  const fromName = settings?.email_from_name ?? settings?.agency_name ?? 'Itinero Agency'
  const accent = settings?.brand_color ?? '#3D5AFE'

  const lineItemsHtml = (invoice.line_items ?? []).map((li: { description: string; quantity: number; unit_price: number }) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #E2E8F4">${li.description}</td><td style="padding:8px 12px;border-bottom:1px solid #E2E8F4;text-align:right">${li.quantity}</td><td style="padding:8px 12px;border-bottom:1px solid #E2E8F4;text-align:right">$${(li.unit_price).toFixed(2)}</td><td style="padding:8px 12px;border-bottom:1px solid #E2E8F4;text-align:right">$${(li.quantity * li.unit_price).toFixed(2)}</td></tr>`
  ).join('')

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: `${fromName} <onboarding@resend.dev>`,
    to: [to],
    subject: `Invoice ${invoice.invoice_number} from ${fromName}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#0B1120">
      <div style="border-left:4px solid ${accent};padding-left:16px;margin-bottom:28px">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9BAAC4;margin:0 0 4px">Invoice</p>
        <h1 style="font-size:22px;font-weight:800;margin:0">${invoice.invoice_number}</h1>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:24px;font-size:13px;color:#6B7A99">
        <div><strong style="color:#0B1120">From</strong><br>${fromName}</div>
        <div style="text-align:right"><strong style="color:#0B1120">Due Date</strong><br>${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'On receipt'}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px">
        <thead><tr style="background:#F8FAFC"><th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9BAAC4">Description</th><th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9BAAC4">Qty</th><th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9BAAC4">Price</th><th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#9BAAC4">Total</th></tr></thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>
      <div style="text-align:right;font-size:20px;font-weight:800;color:#0B1120;margin-bottom:32px">Total: $${Number(invoice.amount).toFixed(2)} ${invoice.currency}</div>
      ${invoice.notes ? `<p style="font-size:13px;color:#6B7A99;border-top:1px solid #E2E8F4;padding-top:16px">${invoice.notes}</p>` : ''}
      <p style="font-size:11px;color:#C8D3E8;margin-top:32px;text-align:center">Powered by Itinero · ${fromName}</p>
    </div>`,
  })

  if (error) return NextResponse.json({ error: (error as { message?: string }).message }, { status: 500 })

  await supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', invoiceId)
  return NextResponse.json({ ok: true })
}
