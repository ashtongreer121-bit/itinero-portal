import { createClient } from '@/lib/supabase/server'
import CalendarView from '@/components/CalendarView'
import type { Trip } from '@/lib/supabase/types'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('owner_id', user!.id)
    .order('start_date', { ascending: true })

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Calendar</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>All trips at a glance</p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <CalendarView trips={(trips as Trip[]) ?? []} />
      </div>
    </div>
  )
}
