import { useEffect, useRef, useState } from 'react'
import { validateWordData } from '../data/words'
import { isISODate, SEASON_END, SEASON_START } from '../lib/dates'
import { exportStore, storageIsPersistent } from '../lib/storage'
import { useApp } from '../store'

/** Replace this with the real note — it's the first thing she'll read here. */
const ABOUT_NOTE = `Placeholder note. Write whatever you want her to find here — why you
made this, what the words have in common, how long you've been planning it.`

export function SettingsView() {
  const { store, updateSettings, importJSON, storageHealthy, eraseHistory } = useApp()
  const { settings } = store
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [persistent, setPersistent] = useState<boolean | null>(null)
  const [erasing, setErasing] = useState(false)

  const issues = validateWordData()
  const dayCount = Object.keys(store.records).length

  useEffect(() => {
    if (!importMessage) return
    const id = window.setTimeout(() => setImportMessage(null), 5000)
    return () => window.clearTimeout(id)
  }, [importMessage])

  useEffect(() => {
    void storageIsPersistent().then(setPersistent)
  }, [])

  const onExport = () => {
    const blob = new Blob([exportStore(store)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `word-of-the-day-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (file: File) => {
    const result = importJSON(await file.text())
    setImportMessage(
      result.ok
        ? `Restored. ${result.added} new day${result.added === 1 ? '' : 's'} added — nothing was overwritten.`
        : result.error,
    )
  }

  return (
    <section className="settings">
      <h2 className="section-title">About this</h2>
      <p className="about-note">{ABOUT_NOTE}</p>

      <h3 className="section-title section-title--small">Sound</h3>
      <label className="row">
        <span>
          <span className="row__label">Chime on a correct guess</span>
          <span className="row__hint">Off by default. Phones stay silent until you tap something anyway.</span>
        </span>
        <input
          type="checkbox"
          checked={settings.sound}
          onChange={(event) => updateSettings({ sound: event.target.checked })}
        />
      </label>

      <h3 className="section-title section-title--small">Backup</h3>
      <p className="section-sub">
        Everything you've played — which days you solved, how long each took, your streak — is stored
        by this browser, on this computer only. It never goes to a server, which also means nobody
        else can put it back for you if it's lost.
      </p>
      <p className="section-sub">
        <strong>Download backup</strong> saves all of that to a small file you can keep anywhere.{' '}
        <strong>Restore from file</strong> reads one back in. Restoring only ever adds days you don't
        already have — an old backup can never overwrite something newer. It's also how you move your
        history to a different computer or browser.
      </p>
      <p className="section-sub">
        {dayCount} day{dayCount === 1 ? '' : 's'} saved right now.
      </p>
      {persistent === false && (
        <p className="notice">
          This browser hasn't marked the app's data as protected yet, which means it could be cleared
          if you go a long stretch without opening it. Installing the app makes that unlikely — and a
          downloaded backup makes it moot.
        </p>
      )}
      <div className="settings__buttons">
        <button type="button" className="button button--ghost" onClick={onExport}>
          Download backup
        </button>
        <button type="button" className="button button--ghost" onClick={() => fileRef.current?.click()}>
          Restore from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onImport(file)
            event.target.value = ''
          }}
        />
      </div>
      {importMessage && <p className="notice">{importMessage}</p>}

      {!storageHealthy && (
        <p className="notice notice--warn">
          This device is refusing to save — private browsing mode will do that. Results won't stick
          until you open the app normally.
        </p>
      )}

      <h3 className="section-title section-title--small">Start over</h3>
      <p className="section-sub">
        This erases every result, streak and time, and hands you back an empty season to play from
        the beginning. It cannot be undone, and it clears the spare copy the app keeps too — so if
        there's any chance you'll want this history back, download a backup first.
      </p>
      {erasing ? (
        <div className="confirm">
          <p className="confirm__text">
            Erase all {dayCount} saved day{dayCount === 1 ? '' : 's'}? There's no undo.
          </p>
          <div className="confirm__buttons">
            <button
              type="button"
              className="button button--danger"
              onClick={() => {
                eraseHistory()
                setErasing(false)
                setImportMessage('Erased. The season is empty and ready to start again.')
              }}
            >
              Yes, erase everything
            </button>
            <button type="button" className="button button--ghost" onClick={() => setErasing(false)}>
              Keep my history
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="button button--ghost"
          disabled={dayCount === 0}
          onClick={() => setErasing(true)}
        >
          {dayCount === 0 ? 'Nothing saved to erase' : 'Erase everything and start over'}
        </button>
      )}

      <h3 className="section-title section-title--small">Puzzle file</h3>
      <p className="section-sub">
        The words and clues are written into the app itself rather than fetched from anywhere, which
        is why it works with no internet. This checks that every day that's been written is complete
        — a word, three clues — and names any that aren't, so a mistake turns up here rather than as a
        broken day months from now.
      </p>
      {issues.length === 0 ? (
        <p className="section-sub">Every day that's been written looks complete.</p>
      ) : (
        <ul className="issues">
          {issues.map((issue) => (
            <li key={issue.date}>
              <strong>{issue.date}</strong> {issue.problem}
            </li>
          ))}
        </ul>
      )}

      <h3 className="section-title section-title--small">Testing</h3>
      <label className="row">
        <span>
          <span className="row__label">Pretend today is</span>
          <span className="row__hint">
            The season runs {SEASON_START} to {SEASON_END}. Set a date here to test before it starts —
            clear it before giving her the app.
          </span>
        </span>
        <input
          type="date"
          value={settings.previewDate ?? ''}
          min={SEASON_START}
          max={SEASON_END}
          onChange={(event) => {
            const value = event.target.value
            updateSettings({ previewDate: isISODate(value) ? value : null })
          }}
        />
      </label>
      {settings.previewDate && (
        <button
          type="button"
          className="button button--ghost"
          onClick={() => updateSettings({ previewDate: null })}
        >
          Back to the real date
        </button>
      )}
    </section>
  )
}
