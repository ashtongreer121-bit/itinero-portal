import { createClient } from '@/lib/supabase/server'
import type { Trip } from '@/lib/supabase/types'
import DashboardClient from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('owner_id', user!.id)
    .order('start_date', { ascending: false })

  return <DashboardClient trips={(trips as Trip[] | null) ?? []} />
}
