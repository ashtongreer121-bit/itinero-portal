import { createClient } from '@/lib/supabase/server'
import InvoiceManager from '@/components/InvoiceManager'
import type { Client, Trip } from '@/lib/supabase/types'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: invoices }, { data: trips }, { data: clients }] = await Promise.all([
    supabase.from('invoices').select('*, trips(title), clients(name)').eq('owner_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('trips').select('id, title, traveler_email').eq('owner_id', user!.id).order('start_date', { ascending: false }),
    supabase.from('clients').select('id, name, email').eq('owner_id', user!.id).order('name'),
  ])

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Invoices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {(invoices ?? []).length === 0 ? 'No invoices yet' : `${(invoices ?? []).length} invoices`}
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <InvoiceManager
          initial={invoices ?? []}
          trips={(trips as Pick<Trip, 'id' | 'title' | 'traveler_email'>[]) ?? []}
          clients={(clients as Pick<Client, 'id' | 'name' | 'email'>[]) ?? []}
        />
      </div>
    </div>
  )
}
