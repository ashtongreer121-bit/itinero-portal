import { createClient } from '@/lib/supabase/server'
import type { TripTemplate } from '@/lib/supabase/types'
import TemplatesManager from '@/components/TemplatesManager'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: templates } = await supabase
    .from('trip_templates')
    .select('*')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Templates</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Save itineraries as reusable templates for repeat destinations
          </p>
        </div>
      </header>
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <TemplatesManager initial={(templates as TripTemplate[]) ?? []} />
        </div>
      </div>
    </div>
  )
}
