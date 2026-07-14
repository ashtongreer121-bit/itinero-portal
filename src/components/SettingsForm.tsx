'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function SettingsForm() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggleTheme(t: 'light' | 'dark') {
    setTheme(t)
    localStorage.setItem('theme', t)
    document.documentElement.setAttribute('data-theme', t)
  }

  return (
    <div className="rounded-xl p-6 space-y-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
        Appearance
      </p>
      <div className="flex gap-3">
        <button onClick={() => toggleTheme('light')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{
            border: `2px solid ${theme === 'light' ? 'var(--accent)' : 'var(--border)'}`,
            background: theme === 'light' ? 'var(--accent-light)' : 'var(--bg)',
            color: theme === 'light' ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}>
          <Sun className="w-4 h-4" /> Light
        </button>
        <button onClick={() => toggleTheme('dark')}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{
            border: `2px solid ${theme === 'dark' ? 'var(--accent)' : 'var(--border)'}`,
            background: theme === 'dark' ? 'var(--accent-light)' : 'var(--bg)',
            color: theme === 'dark' ? 'var(--accent-text)' : 'var(--text-secondary)',
          }}>
          <Moon className="w-4 h-4" /> Dark
        </button>
      </div>
    </div>
  )
}
