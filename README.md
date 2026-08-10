# Word of the Day

A daily guess-the-word game for one person. One word per day from **September 1
to December 31, 2026** (122 days), with three clues revealed at her pace, a
timer she can pause, and a full record of how each day went.

Built as an installable PWA. It runs as a desktop app — a two-column window
with sidebar navigation — and the same build still works as a phone home-screen
app. Either way it works with no connection at all once it's been opened once.

## Running it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # serve the built app (needed to test the service worker)
npm test           # logic tests
```

The service worker is only active in a real build, so test offline behaviour
with `npm run build && npm run preview`, not `npm run dev`.

## Adding the real words

Everything lives in **`src/data/words.ts`**. Replace the placeholder object with
the full 122-day list — no other file needs to change.

```ts
'2026-09-01': {
  word: 'SUNSET',
  clues: [
    'Happens every evening',      // clue 1 — hardest, shown immediately
    'Orange and pink sky',        // clue 2 — revealed on request
    'Opposite of sunrise',        // clue 3 — nearly a giveaway
  ],
  message: 'Whatever you want her to read when the day is over.',
},
```

- `word` — matching is forgiving: case, spacing, punctuation and accents are all
  ignored, so `sun set` and `Sunset!` both count.
- `clues` — exactly three, ordered hardest to easiest.
- `message` — optional. It's the personal line on the result card, and it's the
  line that goes into the shared summary alongside her time. Days without one
  fall back to a neutral sentence, so a half-written list still works.

Missing or malformed days don't crash anything — that day shows a plain
explanation instead, and **About → Puzzle file** lists every problem it found.

The note on the About screen is `ABOUT_NOTE` at the top of
`src/components/SettingsView.tsx`.

## Testing before September

The season hasn't started yet, so **About → Testing → "Pretend today is"** sets
the date the app believes it is. Everything follows it: which puzzle is today,
what's locked, streaks, stats. Clear it before handing the app over.

## How the rules work

- **Clues** are manual. Clue 1 is free; she asks for 2 and 3.
- **Guessing** is unlimited. Nothing is lost by being wrong.
- **Revealing** the word ends the day permanently and logs it as *revealed*, not
  solved. It takes a confirmation tap, because there's no undo.
- **The timer** starts when she opens a day and stops when it ends. It pauses on
  request, and pauses itself whenever the app goes to the background, so time
  spent elsewhere never counts. If the app is force-quit mid-puzzle, only time
  up to the last moment it was alive is banked.
- **Streaks** count consecutive solved days. A revealed day breaks the streak,
  and so does a day that goes by unplayed — but only once it's in the past, so
  an unplayed today is never counted against her.
- **Missed days stay playable.** She can go back and play a day she skipped,
  which closes that gap in the streak. That's deliberate: the app is a gift, not
  an exam.

## Storage

Everything is local — `localStorage`, no backend, nothing leaves the phone.
Because that makes data loss a real risk, the store keeps a rolling backup of
the last good save, quarantines anything unreadable instead of deleting it, and
salvages every valid day when part of the file is corrupt. Imports only ever
add: restoring an old backup can't erase newer results.

**About → Backup** downloads a JSON file and restores from one. That's the only
way her history survives a new phone.

## The daily email

The reminder that needs nothing from her: an email arrives every morning with
the date, which day of the season it is, the first clue, and a button that opens
the app. No permission prompt, no install, no setup on her side — it just shows
up in Gmail wherever she is.

It's written as a delivery ("here's today's word"), not a nag ("you forgot"), so
it can be sent unconditionally. That matters more than it sounds: it means the
sender never has to know whether she's played, so **her history stays entirely
on her device** and nothing about her progress is ever transmitted.

`.github/workflows/daily-reminder.yml` runs `scripts/send-reminder.ts` once a
day through GitHub Actions. It sends through Gmail's SMTP, so the mail comes
from your own address — it lands in her inbox from you, not from a service.

### One-time setup

1. **Turn on 2-Step Verification** for the Gmail account you're sending from,
   then create an **App Password** at <https://myaccount.google.com/apppasswords>.
   This is a 16-character password specific to this app; your real password
   won't work and shouldn't be used.
2. In the repo, under **Settings → Secrets and variables → Actions**, add three
   **secrets**:
   - `SMTP_USER` — the Gmail address sending the mail
   - `SMTP_PASS` — the App Password from step 1
   - `REMINDER_TO` — her email address
3. On the **Variables** tab of the same page, add:
   - `APP_URL` — where the app is hosted
   - `REMINDER_TZ` — her timezone, e.g. `America/New_York`, so "today" means
     today where she is
   - `FROM_NAME` — optional; the name the email appears from
4. Edit the `cron:` line in the workflow. **GitHub runs cron in UTC**, so pick
   the UTC time matching her morning: 9am US Eastern is `0 13 * * *` in summer
   and `0 14 * * *` after the clocks change; 9am UK is `0 8 * * *`; 9am India is
   `30 3 * * *`.
5. Fire a test from the **Actions** tab → **Daily reminder** → **Run workflow**.

Secrets are never printed and never committed — her address lives in GitHub's
secret store, not in this repository.

### Previewing an email locally

```bash
SMTP_USER=you@gmail.com SMTP_PASS=your-app-password \
REMINDER_TO=you@gmail.com APP_URL=http://localhost:4173/ \
REMINDER_DATE=2026-09-03 npm run reminder
```

`REMINDER_DATE` forces a specific day so you can see a real email before
September. Leave it unset in normal operation. Outside the season the script
sends nothing and says so.

### Worth knowing

- **Scheduled runs drift.** GitHub's cron can be a few minutes late under load.
  Fine for a daily nudge, not something to build a surprise around.
- **GitHub disables scheduled workflows after 60 days of repository
  inactivity**, which would end the emails mid-season without warning. The
  workflow guards against this by committing a heartbeat on the 1st of each
  month. If GitHub ever emails you about a workflow being disabled, re-enable it
  from the Actions tab.
- **If a day's puzzle is missing**, the email still sends without a clue and the
  workflow run is annotated with a warning, so the gap gets noticed.

## In-app notifications (the desktop extra)

**About → Daily reminder** also fires a real OS notification once a day, for
when the app is already running on a desktop. This is separate from the email
and needs her permission; the email is the one that needs nothing.
Clicking it focuses the app, and there's a **Send a test notification** button
so it can be verified rather than trusted.

The rules it follows:

- Once per calendar day, never twice.
- Never when the day has already been played.
- Never while she's looking at the app — a popup for something already on
  screen is just noise. It fires when the window is in the background.

**The one requirement: the app has to be running.** There's no backend, so the
notification comes from the page itself rather than from a server. In practice
that means:

- **Desktop** — this works. Install the app (the icon in the browser's address
  bar), then set it to open at login, and the reminder is there every day
  without anyone thinking about it. Left as a browser tab it works too, as long
  as the tab stays open.
- **iPhone / iPad** — it will not fire, and the settings screen says so. Safari
  gives web apps no way to schedule local notifications and stops executing when
  the app is closed. **This is what the daily email is for** — it reaches her
  phone regardless, with nothing to install and nothing to allow.

Independent of all that, the in-app nudge works everywhere with no permission
at all: opening the app shows that today's word is waiting and warns when a
streak is on the line.

## Installing on the desktop

Open the app in Chrome or Edge and click the install icon in the address bar
(Firefox and Safari can run it as a normal window instead). Once installed it
gets its own window, its own icon, and — via the browser's app settings — the
option to launch at login, which is what makes the daily reminder dependable.

## Deploying

`npm run build` produces a static `dist/` that can be hosted anywhere. If it's
served from a subpath, build with the base path set so the manifest and service
worker scope match:

```bash
BASE_PATH=/Word-Of-The-Day/ npm run build
```

Installing to a home screen requires HTTPS (localhost aside).
