import { useState } from 'react'
import { formatDuration, formatLong } from '../lib/dates'
import { buildShareText, shareText } from '../lib/share'
import type { DayRecord } from '../lib/types'

const FALLBACK_MESSAGE = 'One more word, and one more day. See you tomorrow.'

export function ResultCard({
  record,
  word,
  clues,
  message,
}: {
  record: DayRecord
  word: string
  clues: string[]
  message?: string
}) {
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied' | 'failed'>('idle')
  const solved = record.status === 'solved'

  const onShare = async () => {
    const result = await shareText(buildShareText(record, message ?? FALLBACK_MESSAGE))
    setShareState(result)
    window.setTimeout(() => setShareState('idle'), 2400)
  }

  return (
    <section className={`result result--${record.status}`}>
      <p className="result__eyebrow">{formatLong(record.date)}</p>
      <p className="result__verdict">{solved ? 'You got it' : 'Revealed'}</p>
      <h2 className="result__word">{word}</h2>

      <dl className="result__facts">
        <div>
          <dt>Time</dt>
          <dd>{formatDuration(record.durationMs)}</dd>
        </div>
        <div>
          <dt>Clues</dt>
          <dd>{record.cluesUsed} of 3</dd>
        </div>
        <div>
          <dt>Guesses</dt>
          <dd>{record.wrongGuesses === 0 && solved ? 'First try' : record.wrongGuesses + (solved ? 1 : 0)}</dd>
        </div>
      </dl>

      <p className="result__message">{message ?? FALLBACK_MESSAGE}</p>

      <details className="result__clues">
        <summary>All three clues</summary>
        <ol>
          {clues.map((clue, i) => (
            <li key={i}>{clue}</li>
          ))}
        </ol>
      </details>

      <button type="button" className="button button--ghost" onClick={onShare}>
        {shareState === 'idle' && 'Share this result'}
        {shareState === 'shared' && 'Shared'}
        {shareState === 'copied' && 'Copied to clipboard'}
        {shareState === 'failed' && "Couldn't share — try selecting the text"}
      </button>
    </section>
  )
}
