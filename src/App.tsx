import { useEffect, useState } from 'react'
import { ArchiveView } from './components/ArchiveView'
import { PuzzleView } from './components/PuzzleView'
import { SettingsView } from './components/SettingsView'
import { StatsView } from './components/StatsView'
import { formatShort, isInSeason, SEASON_START } from './lib/dates'
import { maybeNotify } from './lib/reminders'
import { useApp } from './store'

type Tab = 'today' | 'season' | 'stats' | 'about'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'season', label: 'Season' },
  { id: 'stats', label: 'Stats' },
  { id: 'about', label: 'About' },
]

export function App() {
  const { today, store, stats } = useApp()
  const [tab, setTab] = useState<Tab>('today')
  const [openDate, setOpenDate] = useState<string | null>(null)

  const activeDate = openDate ?? today
  const playedToday = Boolean(store.records[today])

  // Best-effort daily nudge. Silently does nothing where the OS won't allow it.
  useEffect(() => {
    maybeNotify(store.settings.reminderTime, playedToday)
    const id = window.setInterval(() => maybeNotify(store.settings.reminderTime, playedToday), 60_000)
    return () => window.clearInterval(id)
  }, [store.settings.reminderTime, playedToday])

  const openDay = (date: string) => {
    setOpenDate(date)
    setTab('today')
    window.scrollTo({ top: 0 })
  }

  const seasonStarted = isInSeason(today) || today > SEASON_START

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Word of the Day</h1>
        {!playedToday && seasonStarted && tab === 'today' && !openDate && (
          <p className="app__nudge">
            {stats.currentStreak > 0
              ? `${stats.currentStreak}-day streak on the line.`
              : "Today's word is waiting."}
          </p>
        )}
      </header>

      <main className="app__main">
        {tab === 'today' && (
          <>
            {openDate && openDate !== today && (
              <button type="button" className="back" onClick={() => setOpenDate(null)}>
                ← Back to {formatShort(today)}
              </button>
            )}
            {!seasonStarted && !openDate ? (
              <section className="empty">
                <h2 className="empty__title">Starting soon</h2>
                <p className="empty__body">
                  The first word arrives on September 1. Until then there's nothing to guess — but the
                  season view will show you what's coming.
                </p>
              </section>
            ) : (
              <PuzzleView date={activeDate} />
            )}
          </>
        )}
        {tab === 'season' && <ArchiveView onPick={openDay} />}
        {tab === 'stats' && <StatsView />}
        {tab === 'about' && <SettingsView />}
      </main>

      <nav className="tabs">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={`tabs__button ${tab === entry.id ? 'is-active' : ''}`}
            onClick={() => {
              setTab(entry.id)
              if (entry.id === 'today') setOpenDate(null)
            }}
          >
            {entry.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
