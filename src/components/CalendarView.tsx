'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Trip } from '@/lib/supabase/types'

export default function CalendarView({ trips }: { trips: Trip[] }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function tripsForDay(day: number) {
    const date = new Date(year, month, day)
    return trips.filter(t => {
      const start = new Date(t.start_date)
      const end = new Date(t.end_date)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })
  }

  const cells = Array.from({ length: firstDay }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (day: number | null) =>
    day !== null && today.getDate() === day && today.getMonth() === month && today.getFullYear() === year

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{monthName}</h2>
        <div className="flex gap-1">
          <button onClick={prev} className="icon-btn p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Today
          </button>
          <button onClick={next} className="icon-btn p-2 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-px">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden" style={{ background: 'var(--border)' }}>
        {cells.map((day, i) => {
          const dayTrips = day ? tripsForDay(day) : []
          return (
            <div key={i} className="min-h-24 p-2 flex flex-col gap-1"
              style={{
                background: day ? 'var(--surface)' : 'var(--bg)',
                opacity: day ? 1 : 0.4,
              }}>
              {day && (
                <span className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                  style={{
                    background: isToday(day) ? 'var(--accent)' : 'transparent',
                    color: isToday(day) ? 'white' : 'var(--text-secondary)',
                  }}>
                  {day}
                </span>
              )}
              {dayTrips.slice(0, 3).map(t => (
                <a key={t.id} href={`/dashboard/trips/${t.id}`}
                  className="block px-1.5 py-0.5 rounded text-xs font-semibold truncate leading-5 transition-opacity hover:opacity-80"
                  style={{ background: t.color_theme + 'CC', color: 'white', fontSize: '10px' }}>
                  {t.title}
                </a>
              ))}
              {dayTrips.length > 3 && (
                <span className="text-xs" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                  +{dayTrips.length - 3} more
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      {trips.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          {trips.filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i).slice(0, 10).map(t => (
            <div key={t.id} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color_theme }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
