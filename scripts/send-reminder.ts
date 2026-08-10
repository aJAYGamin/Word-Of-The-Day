/**
 * Sends the daily "today's word is ready" email. Run once a day by
 * .github/workflows/daily-reminder.yml.
 *
 * Everything it needs comes from the environment, so her address and the
 * mail password live in GitHub secrets rather than in this repository:
 *
 *   SMTP_USER   the Gmail address the mail is sent from
 *   SMTP_PASS   a Google App Password for that account (not the login password)
 *   REMINDER_TO where the mail goes
 *   APP_URL     where the app is hosted
 *   REMINDER_TZ optional IANA timezone deciding which date "today" is
 *   FROM_NAME   optional display name on the message
 */
import nodemailer from 'nodemailer'
import { getEntry } from '../src/data/words'
import { isInSeason, isISODate } from '../src/lib/dates'
import { composeReminder } from '../src/lib/reminderEmail'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing ${name}. Set it as a repository secret.`)
    process.exit(1)
  }
  return value
}

/** The date it is *where she is*, which is not necessarily the date in UTC. */
function todayInZone(timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the key format used here.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function main() {
  const user = required('SMTP_USER')
  const pass = required('SMTP_PASS')
  const to = required('REMINDER_TO')
  const appUrl = required('APP_URL')
  const timeZone = process.env.REMINDER_TZ || 'UTC'
  const fromName = process.env.FROM_NAME || 'Word of the Day'

  // REMINDER_DATE forces a specific day, which is how you preview a real email
  // before the season starts. Unset in normal operation.
  let date: string
  const override = process.env.REMINDER_DATE
  if (override) {
    if (!isISODate(override)) {
      console.error(`REMINDER_DATE "${override}" is not a YYYY-MM-DD date.`)
      process.exit(1)
    }
    date = override
  } else {
    try {
      date = todayInZone(timeZone)
    } catch {
      console.error(`REMINDER_TZ "${timeZone}" is not a valid timezone.`)
      process.exit(1)
    }
  }

  if (!isInSeason(date)) {
    console.log(`${date} is outside the season — nothing to send.`)
    return
  }

  const entry = getEntry(date)
  if (!entry.ok) {
    // Still worth sending: she can open the app even if the clue is missing.
    // The warning surfaces on the workflow run so the gap gets noticed.
    console.log(`::warning::No usable puzzle for ${date}: ${entry.detail}`)
  }

  const email = composeReminder({
    date,
    appUrl,
    clue: entry.ok ? entry.entry.clues[0] : undefined,
  })

  // Defaults to Gmail; overridable so another provider (or a local server
  // during testing) works without touching this file.
  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT || 465)
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transport.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  })

  console.log(`Sent the reminder for ${date} (${timeZone}).`)
}

main().catch((error) => {
  console.error('Failed to send the reminder:', error)
  process.exit(1)
})
