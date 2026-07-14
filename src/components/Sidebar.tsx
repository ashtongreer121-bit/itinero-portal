'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { MapPin, LogOut, LayoutGrid, Settings, Moon, Sun, Users, LayoutTemplate, BarChart2, CalendarDays, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail.slice(0, 2).toUpperCase()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') { setDark(true); document.documentElement.setAttribute('data-theme', 'dark') }
  }, [])

  function toggleTheme() {
    const next = dark ? 'light' : 'dark'
    setDark(!dark)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <aside style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      className="w-52 shrink-0 flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg"
            style={{ background: 'var(--accent)' }}>
            <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-white tracking-tight text-sm">Itinero</span>
          <span className="text-xs ml-auto px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--sidebar-text)', fontSize: '10px', letterSpacing: '0.05em' }}>
            AGENCY
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--sidebar-text)', opacity: 0.4, letterSpacing: '0.12em' }}>
          Workspace
        </p>
        <NavItem href="/dashboard" icon={<LayoutGrid className="w-4 h-4" />} label="Trips" active={pathname === '/dashboard'} />
        <NavItem href="/dashboard/calendar" icon={<CalendarDays className="w-4 h-4" />} label="Calendar" active={pathname.startsWith('/dashboard/calendar')} />
        <NavItem href="/dashboard/clients" icon={<Users className="w-4 h-4" />} label="Clients" active={pathname.startsWith('/dashboard/clients')} />
        <NavItem href="/dashboard/invoices" icon={<FileText className="w-4 h-4" />} label="Invoices" active={pathname.startsWith('/dashboard/invoices')} />
        <NavItem href="/dashboard/templates" icon={<LayoutTemplate className="w-4 h-4" />} label="Templates" active={pathname.startsWith('/dashboard/templates')} />
        <NavItem href="/dashboard/analytics" icon={<BarChart2 className="w-4 h-4" />} label="Analytics" active={pathname.startsWith('/dashboard/analytics')} />
        <NavItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" active={pathname === '/dashboard/settings'} />
      </nav>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'var(--accent)', fontSize: '11px' }}>
            {initials}
          </div>
          <span className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>{userEmail}</span>
        </div>
        <button onClick={toggleTheme}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mb-0.5"
          style={{ color: 'var(--sidebar-text)' }}
>
          {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span className="text-xs">{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button onClick={signOut}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: 'var(--sidebar-text)' }}
>
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-xs">Sign out</span>
        </button>
      </div>
    </aside>
  )
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        background: active ? 'var(--sidebar-active-bg)' : 'transparent',
        color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
      }}>
      {icon}
      {label}
    </Link>
  )
}
