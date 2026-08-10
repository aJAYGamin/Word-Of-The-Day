import { useEffect, useRef, useState } from 'react'
import { formatDuration, formatLong } from '../lib/dates'
import { playSolveChime } from '../lib/sound'
import { elapsedMs, isRunning } from '../lib/timer'
import { useApp } from '../store'
import { Confetti } from './Confetti'
import { ResultCard } from './ResultCard'
import { useNow } from './useNow'

export function PuzzleView({ date }: { date: string }) {
  const { dayState, startDay, revealNextClue, submitGuess, revealWord, setPaused, store } = useApp()
  const state = dayState(date)

  const [guess, setGuess] = useState('')
  const [shake, setShake] = useState(false)
  const [confirmingReveal, setConfirmingReveal] = useState(false)
  const [justSolved, setJustSolved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const playable = state.kind === 'playable'
  const running = playable && isRunning(state.progress.timer)
  const now = useNow(250, running)

  // Opening a playable day starts (or resumes) its clock — including when the
  // app comes back to the foreground, which is what restarts this one puzzle
  // after the store paused everything on the way out.
  useEffect(() => {
    if (!playable) return
    startDay(date)
    const onVisible = () => {
      if (document.visibilityState === 'visible') startDay(date)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [date, playable, startDay])

  // Reset transient UI when moving between days.
  useEffect(() => {
    setGuess('')
    setConfirmingReveal(false)
    setJustSolved(false)
  }, [date])

  if (state.kind === 'offseason') {
    return (
      <EmptyDay
        title="Nothing here"
        body="This date falls outside the season. The words run from September 1 to December 31."
      />
    )
  }

  if (state.kind === 'locked') {
    return (
      <EmptyDay
        title="Not yet"
        body={`${formatLong(date)} hasn't arrived. One word a day — no skipping ahead.`}
      />
    )
  }

  if (state.kind === 'error') {
    return <EmptyDay title="This day needs fixing" body={state.detail} tone="error" />
  }

  if (state.kind === 'finished') {
    return (
      <>
        <Confetti active={justSolved} />
        <ResultCard record={state.record} word={state.word} clues={state.clues} message={state.message} />
      </>
    )
  }

  const { progress, clues } = state
  const visibleClues = clues.slice(0, progress.cluesRevealed)
  const elapsed = elapsedMs(progress.timer, now)
  // startedAt is 0 for the placeholder used on the frame before startDay
  // commits — without this guard a fresh day flashes the paused veil.
  const paused = progress.startedAt > 0 && !isRunning(progress.timer)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (guess.trim().length === 0) return
    const correct = submitGuess(date, guess)
    if (correct) {
      setJustSolved(true)
      playSolveChime(store.settings.sound)
      return
    }
    setGuess('')
    setShake(true)
    window.setTimeout(() => setShake(false), 420)
    inputRef.current?.focus()
  }

  return (
    <section className="puzzle">
      <header className="puzzle__header">
        <p className="puzzle__date">{formatLong(date)}</p>
        <button
          type="button"
          className={`timer ${paused ? 'timer--paused' : ''}`}
          onClick={() => setPaused(date, !paused)}
          aria-label={paused ? 'Resume the timer' : 'Pause the timer'}
        >
          <span className="timer__dot" />
          <span className="timer__value">{formatDuration(elapsed)}</span>
          <span className="timer__action">{paused ? 'Resume' : 'Pause'}</span>
        </button>
      </header>

      {paused ? (
        <div className="paused-veil">
          <p className="paused-veil__title">Paused</p>
          <p className="paused-veil__body">The clock is stopped. Come back whenever.</p>
          <button type="button" className="button" onClick={() => setPaused(date, false)}>
            Resume
          </button>
        </div>
      ) : (
        <>
          <ol className="clues">
            {visibleClues.map((clue, index) => (
              <li key={index} className="clue">
                <span className="clue__number">Clue {index + 1}</span>
                <p className="clue__text">{clue}</p>
              </li>
            ))}
          </ol>

          <form className={`guess ${shake ? 'guess--wrong' : ''}`} onSubmit={onSubmit}>
            <input
              ref={inputRef}
              className="guess__input"
              value={guess}
              onChange={(event) => setGuess(event.target.value)}
              placeholder="Your guess"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="done"
              aria-label="Your guess"
            />
            <button type="submit" className="button guess__submit" disabled={guess.trim().length === 0}>
              Guess
            </button>
          </form>

          {progress.wrongGuesses > 0 && (
            <p className="guess__count">
              {progress.wrongGuesses} guess{progress.wrongGuesses === 1 ? '' : 'es'} so far. Keep going.
            </p>
          )}

          <div className="puzzle__actions">
            {progress.cluesRevealed < 3 ? (
              <button type="button" className="button button--ghost" onClick={() => revealNextClue(date)}>
                Stuck? Reveal clue {progress.cluesRevealed + 1}
              </button>
            ) : confirmingReveal ? (
              <div className="confirm">
                <p className="confirm__text">This ends today — no more guessing, and it won't count as solved.</p>
                <div className="confirm__buttons">
                  <button type="button" className="button button--danger" onClick={() => revealWord(date)}>
                    Show me the word
                  </button>
                  <button type="button" className="button button--ghost" onClick={() => setConfirmingReveal(false)}>
                    Keep trying
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="button button--ghost" onClick={() => setConfirmingReveal(true)}>
                Give up and reveal the word
              </button>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function EmptyDay({ title, body, tone }: { title: string; body: string; tone?: 'error' }) {
  return (
    <section className={`empty ${tone === 'error' ? 'empty--error' : ''}`}>
      <h2 className="empty__title">{title}</h2>
      <p className="empty__body">{body}</p>
    </section>
  )
}
