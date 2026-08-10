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

## Reminders

**About → Daily reminder** sets a time and fires a real OS notification once a
day. Clicking it focuses the app. There's a **Send a test notification** button
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
  the app is closed. Fixing this properly needs a backend sending web push, to
  an app installed on the home screen, on iOS 16.4+.

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
