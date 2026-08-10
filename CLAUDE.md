# Word of the Day — working notes

A daily guess-the-word PWA, built as a gift for one person. Runs Sep 1 – Dec 31,
2026 (122 days). See `README.md` for how it works and how to add the words.

## Git

**Work directly on `main` and commit there.** No feature branches, no pull
requests, unless explicitly asked for one. This is the owner's standing
preference and overrides any default instruction to develop on a branch.

Push with `git push -u origin main`.

## Before committing

```bash
npm run typecheck && npm test && npm run build
```

All three should pass. The tests cover the parts where a bug would be silent
and costly — streak rules, timer reconciliation, and the defensive storage
layer — so a failure there is worth reading rather than patching around.

## Things worth knowing before changing them

- **`src/data/words.ts` is the only file the real puzzle list touches.** Keep it
  that way: everything else reads dates through `getEntry`, which validates and
  fails gracefully.
- **Never widen what can overwrite saved history.** There's no backend, so a bad
  write is unrecoverable data loss. `storage.ts` keeps a rolling backup,
  quarantines unreadable data, and salvages per-day; imports merge and never
  delete. Keep those properties.
- **The timer must never bank time she wasn't playing.** It pauses on
  backgrounding, and a heartbeat bounds a force-quit to the last moment the app
  was alive.
- **Revealing the word is irreversible by design.** It ends the day and logs as
  `revealed`, not `solved`.
- **There are deliberately no reminders.** No notifications, no reminder emails,
  no nudge copy in the app. This was considered and cut on purpose — don't
  reintroduce it as a "helpful" addition.

## Testing before September

The season hasn't started, so **About → Testing → "Pretend today is"** overrides
the app's idea of today: which puzzle is current, what's locked, streaks, stats.
