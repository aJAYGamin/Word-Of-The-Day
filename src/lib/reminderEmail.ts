import { formatLong, seasonDays } from './dates'

/**
 * The daily email is a delivery, not a nag: "here is today's word", never
 * "you forgot". That framing is what lets it be sent unconditionally, which
 * in turn means the sender never needs to know whether she has played — so
 * her history stays on her device where it belongs.
 */

export interface ReminderEmail {
  subject: string
  text: string
  html: string
}

export interface ReminderInput {
  date: string
  appUrl: string
  /** The first clue, included so the day starts before she even opens the app. */
  clue?: string
}

/** 1-based position of a date within the season, or null if it falls outside. */
export function dayNumber(date: string): number | null {
  const index = seasonDays().indexOf(date)
  return index === -1 ? null : index + 1
}

export function totalDays(): number {
  return seasonDays().length
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function composeReminder({ date, appUrl, clue }: ReminderInput): ReminderEmail {
  const day = dayNumber(date)
  const total = totalDays()
  const counter = day === null ? '' : `Day ${day} of ${total}`
  const subject = day === null ? 'Word of the Day' : `Word of the Day · Day ${day}`

  const textLines = [
    formatLong(date),
    counter,
    '',
    clue ? `Clue 1: ${clue}` : "Today's word is waiting for you.",
    '',
    `Play: ${appUrl}`,
  ].filter((line) => line !== undefined)

  // Inline styles only, and a table for the button: Gmail strips <style>
  // blocks and ignores most modern layout, so this stays deliberately plain.
  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px 12px;background:#fdf6ee;font-family:Georgia,'Times New Roman',serif;color:#2b1b2f;">
    <div style="max-width:520px;margin:0 auto;background:#fffaf5;border:1px solid rgba(43,27,47,0.12);border-radius:16px;padding:32px 28px;">
      <p style="margin:0;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6d5b6a;font-family:Helvetica,Arial,sans-serif;">
        Word of the Day
      </p>
      <h1 style="margin:12px 0 4px;font-size:26px;font-weight:500;">${escapeHtml(formatLong(date))}</h1>
      ${counter ? `<p style="margin:0;color:#6d5b6a;font-size:14px;font-family:Helvetica,Arial,sans-serif;">${counter}</p>` : ''}
      ${
        clue
          ? `<div style="margin:24px 0;padding:20px;background:#fdf6ee;border:1px solid rgba(43,27,47,0.12);border-radius:12px;">
        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#e0a458;font-family:Helvetica,Arial,sans-serif;">Clue 1</p>
        <p style="margin:0;font-size:19px;line-height:1.45;">${escapeHtml(clue)}</p>
      </div>`
          : `<p style="margin:24px 0;font-size:18px;line-height:1.5;">Today's word is waiting for you.</p>`
      }
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
        <tr>
          <td style="border-radius:999px;background:#d1603d;">
            <a href="${escapeHtml(appUrl)}"
               style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:16px;font-family:Helvetica,Arial,sans-serif;border-radius:999px;">
              Play today's word
            </a>
          </td>
        </tr>
      </table>
    </div>
  </body>
</html>`

  return { subject, text: textLines.join('\n'), html }
}
