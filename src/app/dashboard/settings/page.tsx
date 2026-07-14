import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'
import BrandingForm from '@/components/BrandingForm'
import type { AgencySettings } from '@/lib/supabase/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: branding } = await supabase.from('agency_settings').select('*').eq('owner_id', user!.id).single()

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-8 py-5"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Manage your account and agency</p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Account */}
          <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>Account</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                style={{ background: 'var(--accent)' }}>
                {user?.email?.[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Agency account</p>
              </div>
            </div>
          </div>

          {/* Branding */}
          <BrandingForm initial={(branding as AgencySettings) ?? {}} />

          {/* Appearance */}
          <SettingsForm />

          {/* Traveler web link */}
          <div className="rounded-xl p-6 space-y-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
              Traveler Web View
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Share a web link with travelers so they can view their itinerary in a browser — no app required.
            </p>
            <div className="rounded-lg px-3 py-2.5 font-mono text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              https://your-domain.com/trip/[TRIP_CODE]
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
