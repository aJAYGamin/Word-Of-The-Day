import { useEffect, useState } from 'react'
import { ArchiveView } from './components/ArchiveView'
import { PuzzleView } from './components/PuzzleView'
import { SettingsView } from './components/SettingsView'
import { StatsView } from './components/StatsView'
import { formatShort, isInSeason, SEASON_START } from './lib/dates'
import { applyTheme } from './lib/theme'
import { useApp } from './store'

type Tab = 'today' | 'season' | 'stats' | 'about'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'season', label: 'Season' },
  { id: 'stats', label: 'Stats' },
  { id: 'about', label: 'About' },
]

export function App() {
  const { today } = useApp()
  const [tab, setTab] = useState<Tab>('today')
  const [openDate, setOpenDate] = useState<string | null>(null)

  const activeDate = openDate ?? today

  // Opening a day from another month re-dresses the whole app in that month's
  // colours, so browsing back through the season feels like walking back
  // through it.
  useEffect(() => {
    applyTheme(activeDate)
  }, [activeDate])

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
