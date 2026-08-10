import { useMemo } from 'react'
import { fromISODate, monthLabel, seasonDays } from '../lib/dates'
import { useApp } from '../store'

type CellState = 'solved' | 'revealed' | 'missed' | 'today' | 'locked'

function buildMonths(): { label: string; days: string[]; leading: number }[] {
  const byMonth = new Map<string, string[]>()
  for (const date of seasonDays()) {
    const key = date.slice(0, 7)
    const list = byMonth.get(key) ?? []
    list.push(date)
    byMonth.set(key, list)
  }
  return [...byMonth.entries()].map(([, days]) => ({
    label: monthLabel(days[0]),
    days,
    leading: fromISODate(days[0]).getDay(),
  }))
}

export function ArchiveView({ onPick }: { onPick: (date: string) => void }) {
  const { store, today } = useApp()
  const months = useMemo(buildMonths, [])

  const stateFor = (date: string): CellState => {
    const record = store.records[date]
    if (record) return record.status
    if (date === today) return 'today'
    if (date < today) return 'missed'
    return 'locked'
  }

  return (
    <section className="archive">
      <h2 className="section-title">The season</h2>
      <p className="section-sub">September through December. Tap any day you have already reached.</p>

      <div className="months">
        {months.map((month) => (
          <div key={month.label} className="month">
            <h3 className="month__label">{month.label}</h3>
            <div className="month__grid">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <span key={i} className="month__weekday" aria-hidden="true">
                  {day}
                </span>
              ))}
              {Array.from({ length: month.leading }, (_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {month.days.map((date) => {
                const state = stateFor(date)
                const disabled = state === 'locked'
                return (
                  <button
                    key={date}
                    type="button"
                    className={`day day--${state}`}
                    disabled={disabled}
                    onClick={() => onPick(date)}
                    aria-label={`${date}, ${state}`}
                  >
                    {fromISODate(date).getDate()}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <ul className="legend">
        <li>
          <span className="swatch swatch--solved" /> Solved
        </li>
        <li>
          <span className="swatch swatch--revealed" /> Revealed
        </li>
        <li>
          <span className="swatch swatch--missed" /> Missed
        </li>
        <li>
          <span className="swatch swatch--locked" /> Still to come
        </li>
      </ul>
    </section>
  )
}
