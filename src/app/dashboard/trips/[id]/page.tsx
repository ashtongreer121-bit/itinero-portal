import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, StickyNote, Smartphone, Printer, LayoutTemplate } from 'lucide-react'
import type { Trip, TripEvent, TripDocument } from '@/lib/supabase/types'
import TripCodeCard from '@/components/TripCodeCard'
import DocumentsPanel from '@/components/DocumentsPanel'
import DuplicateTripButton from '@/components/DuplicateTripButton'
import SaveTemplateButton from '@/components/SaveTemplateButton'
import TripDetailClient from '@/components/TripDetailClient'
import ReminderScheduler from '@/components/ReminderScheduler'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).eq('owner_id', user!.id).single()
  if (!trip) notFound()

  const { data: events } = await supabase.from('events').select('*').eq('trip_id', id).order('sort_order', { ascending: true }).order('start_time', { ascending: true })
  const { data: docs } = await supabase.from('trip_documents').select('*').eq('trip_id', id).order('created_at', { ascending: true })

  const t = trip as Trip
  const e = (events as TripEvent[]) ?? []
  const start = new Date(t.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  const end   = new Date(t.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-8 py-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="icon-btn p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-0.5 self-stretch rounded-full"
          style={{ background: t.color_theme || 'var(--accent)', minHeight: '24px' }} />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {t.title}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {t.destination && <>{t.destination} · </>}{start} – {end}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DuplicateTripButton tripId={id} />
          <SaveTemplateButton tripId={id} />
          <Link href={`/dashboard/trips/${id}/print`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            <Printer className="w-3 h-3" /> Print
          </Link>
          <Link href={`/dashboard/trips/${id}/preview`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'var(--accent-light)', color: 'var(--accent-text)' }}>
            <Smartphone className="w-3 h-3" /> Preview
          </Link>
          <Link href={`/dashboard/trips/${id}/edit`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Edit Trip
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6">

          {/* Events — 2/3 (client component for drag-drop + AI + send email) */}
          <TripDetailClient trip={t} initialEvents={e} tripId={id} />

          {/* Sidebar — 1/3 */}
          <div className="space-y-4">
            <TripCodeCard trip={t} />

            {t.notes && (
              <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <StickyNote className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Notes</p>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{t.notes}</p>
              </div>
            )}

            <DocumentsPanel tripId={id} initial={(docs as TripDocument[]) ?? []} />
            <ReminderScheduler trip={t} events={e} />
          </div>

        </div>
      </div>
    </div>
  )
}
