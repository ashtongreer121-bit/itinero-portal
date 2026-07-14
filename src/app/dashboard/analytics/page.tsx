import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from '@/components/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: trips }, { data: clients }, { data: invoices }] = await Promise.all([
    supabase.from('trips').select('*').eq('owner_id', user!.id),
    supabase.from('clients').select('*').eq('owner_id', user!.id),
    supabase.from('invoices').select('*').eq('owner_id', user!.id),
  ])

  const tripIds = (trips ?? []).map((t: { id: string }) => t.id)
  const { data: events } = tripIds.length
    ? await supabase.from('events').select('trip_id, event_type').in('trip_id', tripIds)
    : { data: [] }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Overview of your agency activity</p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <AnalyticsDashboard
          trips={trips ?? []}
          clients={clients ?? []}
          invoices={invoices ?? []}
          events={events ?? []}
        />
      </div>
    </div>
  )
}
