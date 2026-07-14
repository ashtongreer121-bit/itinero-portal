import { createClient } from '@/lib/supabase/server'
import type { Client } from '@/lib/supabase/types'
import ClientsManager from '@/components/ClientsManager'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_id', user!.id)
    .order('name', { ascending: true })

  // Get trip counts per client
  const { data: trips } = await supabase
    .from('trips')
    .select('id, client_id, title, start_date, end_date')
    .eq('owner_id', user!.id)
    .not('client_id', 'is', null)

  const tripsByClient = (trips ?? []).reduce<Record<string, typeof trips>>((acc, t) => {
    if (!t.client_id) return acc
    if (!acc[t.client_id]) acc[t.client_id] = []
    acc[t.client_id]!.push(t)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Clients</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {(clients ?? []).length === 0 ? 'No clients yet' : `${(clients ?? []).length} clients`}
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-3xl mx-auto">
          <ClientsManager initial={(clients as Client[]) ?? []} tripsByClient={tripsByClient as Record<string, Array<{ id: string; title: string; start_date: string; end_date: string }>>} />
        </div>
      </div>
    </div>
  )
}
