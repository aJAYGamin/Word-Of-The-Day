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

## Look and feel

The app is dressed for the month it's showing:

| Month | Accent | Secondary |
| --- | --- | --- |
| September | harvest gold | fading summer green |
| October | pumpkin | Halloween plum |
| November | cranberry | bronze |
| December | evergreen | frost periwinkle |

Underneath all four the canvas and the navigation stay lavender, so the season
changes without the app becoming a different app. Opening a day from another
month re-dresses everything in that month's colours, so browsing back through
the season feels like walking back through it.

Every colour comes from a token at the top of `src/styles/app.css`; nothing
below that hardcodes a hex value, so changing a month is a four-line edit. The
month is chosen in `src/lib/theme.ts` and applied as `data-month` on the root
element. Light and dark are both defined for each month.

One typeface throughout — Iowan Old Style, which ships with macOS, falling back
through Palatino to Georgia. No webfont, so it renders identically offline.

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

## Using it on a Mac

She just opens the URL — there's nothing to clone, install or set up. The whole
app is static files; her results are saved by the browser on her own machine and
never leave it.

**Use Chrome, and install it.** Open the URL in Chrome, click the install icon
in the address bar, and it becomes a real app with its own window and Dock icon.
This isn't cosmetic — see below.

### Where the data lives, and how it can be lost

Results are kept in the browser's `localStorage`, which is per-browser and
per-machine. Two consequences worth knowing:

- **Safari deletes it after seven days of not visiting.** Safari clears
  script-writable storage for sites you haven't opened in a week. If she plays
  most days nothing happens, but a quiet week could take her history with it.
  Chrome has no such rule.
- **A different browser is a different history.** Opening it in Safari after
  playing in Chrome shows an empty season. Same for a different Mac.

The app asks the browser to mark its data as protected (`navigator.storage
.persist()`), which Chrome grants to installed apps and frequently-used sites.
If that request hasn't been granted, the Backup section in About says so.

**About → Backup** downloads a JSON file, and restoring merges rather than
overwrites. That's the real safety net, and it's the only thing that moves her
history to another machine.

There are no reminders or notifications of any kind, by design — she opens it
when she wants to.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds, typechecks, tests and publishes on every
push to `main`. It sets `BASE_PATH` from the repository name automatically, so
the manifest, service worker scope and asset URLs all line up with the
`/Word-Of-The-Day/` subpath Pages serves from.

**Turn it on:** repository **Settings → Pages → Source: GitHub Actions**, then
push (or re-run the workflow from the Actions tab). The site lands at:

```
https://ajaygamin.github.io/Word-Of-The-Day/
```

### Before switching it on

- **Pages needs a public repository** unless you're on a paid GitHub plan. This
  repository is currently private.
- **The published site is public either way.** Pages has no password. The URL is
  obscure, not secret.
- **The words, clues and personal messages ship inside the JavaScript bundle.**
  Anyone who opens the URL and looks at the source can read all 122 answers
  ahead of time. There's no way around that without a backend — it's the cost of
  a static app that works offline. It doesn't affect her unless she goes
  looking, but making the repository public additionally makes the source
  searchable on GitHub.

If you'd rather keep the repository private without paying, Netlify and Vercel
both deploy from a private repo on their free tiers and give the same kind of
public URL. The build command is the same; set `BASE_PATH=/` there, since they
serve from the domain root.

Building it yourself, for any host:

```bash
BASE_PATH=/Word-Of-The-Day/ npm run build   # subpath
npm run build                               # domain root
```

Installing as an app requires HTTPS, which Pages provides (localhost aside).
