import { formatDuration } from '../lib/dates'
import { useApp } from '../store'

export function StatsView() {
  const { stats } = useApp()

  const tiles: { label: string; value: string; hint?: string }[] = [
    { label: 'Solved', value: String(stats.solved), hint: `of ${stats.played} played` },
    { label: 'Current streak', value: String(stats.currentStreak), hint: 'days in a row' },
    { label: 'Longest streak', value: String(stats.longestStreak), hint: 'days' },
    {
      label: 'Solve rate',
      value: stats.played ? `${Math.round(stats.solveRate * 100)}%` : '—',
    },
    {
      label: 'Average time',
      value: stats.averageDurationMs === null ? '—' : formatDuration(stats.averageDurationMs),
    },
    {
      label: 'Best time',
      value: stats.bestDurationMs === null ? '—' : formatDuration(stats.bestDurationMs),
      hint: 'solved days only',
    },
    {
      label: 'Average clues',
      value: stats.averageCluesUsed === null ? '—' : stats.averageCluesUsed.toFixed(1),
      hint: 'when solved',
    },
    { label: 'Revealed', value: String(stats.revealed), hint: 'gave up' },
  ]

  const maxBar = Math.max(1, ...stats.clueBreakdown)

  return (
    <section className="stats">
      <h2 className="section-title">How it's going</h2>

      <div className="tiles">
        {tiles.map((tile) => (
          <div key={tile.label} className="tile">
            <p className="tile__value">{tile.value}</p>
            <p className="tile__label">{tile.label}</p>
            {tile.hint && <p className="tile__hint">{tile.hint}</p>}
          </div>
        ))}
      </div>

      <h3 className="section-title section-title--small">Clues used when solving</h3>
      {stats.solved === 0 ? (
        <p className="section-sub">No solved days yet — this fills in as you play.</p>
      ) : (
        <div className="bars">
          {stats.clueBreakdown.map((count, index) => (
            <div key={index} className="bars__row">
              <span className="bars__label">{index + 1} clue{index === 0 ? '' : 's'}</span>
              <span className="bars__track">
                <span className="bars__fill" style={{ width: `${(count / maxBar) * 100}%` }} />
              </span>
              <span className="bars__count">{count}</span>
            </div>
          ))}
        </div>
      )}

      {stats.missed > 0 && (
        <p className="section-sub">
          {stats.missed} day{stats.missed === 1 ? '' : 's'} went by unplayed. You can still go back and
          play {stats.missed === 1 ? 'it' : 'them'} from the season view.
        </p>
      )}
    </section>
  )
}
