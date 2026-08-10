import { useEffect, useRef, useState } from 'react'
import { validateWordData } from '../data/words'
import { isISODate, SEASON_END, SEASON_START } from '../lib/dates'
import { detectSupport, isInstalled, permission, requestPermission, sendTestNotification } from '../lib/reminders'
import { exportStore } from '../lib/storage'
import { useApp } from '../store'

/** Replace this with the real note — it's the first thing she'll read here. */
const ABOUT_NOTE = `Placeholder note. Write whatever you want her to find here — why you
made this, what the words have in common, how long you've been planning it.`

export function SettingsView() {
  const { store, updateSettings, importJSON, storageHealthy } = useApp()
  const { settings } = store
  const fileRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState(() => permission())
  const [testSent, setTestSent] = useState(false)
  const support = detectSupport()
  const installed = isInstalled()

  const issues = validateWordData()
  const dayCount = Object.keys(store.records).length

  useEffect(() => {
    if (!importMessage) return
    const id = window.setTimeout(() => setImportMessage(null), 5000)
    return () => window.clearTimeout(id)
  }, [importMessage])

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

  const onToggleReminder = async () => {
    if (settings.reminderTime) {
      updateSettings({ reminderTime: null })
      return
    }
    const granted = await requestPermission()
    setPermissionState(granted)
    updateSettings({ reminderTime: '19:00' })
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

      <h3 className="section-title section-title--small">Daily reminder</h3>
      <label className="row">
        <span>
          <span className="row__label">Remind me to play</span>
          <span className="row__hint">
            {support === 'unsupported-ios'
              ? "On iPhone and iPad a web app can't schedule notifications — this will only nudge you inside the app when you open it."
              : 'A desktop notification once a day, as long as the app is running.'}
          </span>
        </span>
        <input type="checkbox" checked={settings.reminderTime !== null} onChange={onToggleReminder} />
      </label>

      {settings.reminderTime !== null && (
        <>
          <label className="row">
            <span className="row__label">Reminder time</span>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(event) => updateSettings({ reminderTime: event.target.value || null })}
            />
          </label>

          {permissionState === 'denied' ? (
            <p className="notice notice--warn">
              Notifications are blocked for this site in your browser settings. The in-app nudge still
              works, but nothing will pop up.
            </p>
          ) : permissionState === 'granted' ? (
            <>
              <div className="settings__buttons">
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setTestSent(sendTestNotification())}
                >
                  {testSent ? 'Sent — check your notifications' : 'Send a test notification'}
                </button>
              </div>
              {support === 'supported' && !installed && (
                <p className="notice">
                  This only fires while the app is open. Install it — the icon in the address bar — and
                  set it to open at login, and the reminder will be there every day without you
                  thinking about it.
                </p>
              )}
            </>
          ) : (
            <p className="notice">Allow notifications when your browser asks, or nothing will appear.</p>
          )}
        </>
      )}

      <h3 className="section-title section-title--small">Backup</h3>
      <p className="section-sub">
        {dayCount} day{dayCount === 1 ? '' : 's'} of history saved on this device. Nothing is sent
        anywhere, so a backup is the only way it survives a new phone.
      </p>
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

      <h3 className="section-title section-title--small">Puzzle file</h3>
      {issues.length === 0 ? (
        <p className="section-sub">All written days look valid.</p>
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
