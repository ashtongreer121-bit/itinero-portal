import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Trip, TripEvent } from '@/lib/supabase/types'
import TravelerPreview from '@/components/TravelerPreview'

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trip } = await supabase.from('trips').select('*').eq('id', id).eq('owner_id', user!.id).single()
  if (!trip) notFound()

  const { data: events } = await supabase.from('events').select('*').eq('trip_id', id).order('start_time', { ascending: true })

  return (
    <div className="flex flex-col h-full">
      <header className="px-8 py-5 flex items-center gap-4"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <Link href={`/dashboard/trips/${id}`} className="icon-btn p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-tertiary)' }}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Traveler Preview
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            This is exactly what your client sees in the Itinero app
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8 flex justify-center">
        <TravelerPreview trip={trip as Trip} events={(events as TripEvent[]) ?? []} />
      </div>
    </div>
  )
}
