import type { DayEntry, WordData } from '../lib/types'

/**
 * THE ONLY FILE YOU NEED TO EDIT TO ADD THE REAL PUZZLES.
 *
 * One entry per calendar date, "YYYY-MM-DD", covering 2026-09-01 through
 * 2026-12-31 (122 days). Nothing in the app reads the puzzles from anywhere
 * else, so dropping in the full list is a straight replacement of the object
 * below — no other code changes.
 *
 *   "2026-09-01": {
 *     word: "SUNSET",                       // the answer; matching ignores case
 *     clues: ["…", "…", "…"],               // exactly three, easiest last
 *     message: "…"                          // optional note shown when the day ends
 *   }
 *
 * `message` is the personal line on the result card. Leave it out and she
 * sees a neutral fallback instead, so a half-filled list still works.
 *
 * The entries below are placeholders for testing — replace them wholesale.
 */
export const WORDS: WordData = {
  '2026-09-01': {
    word: 'Feed My Starving Children',
    clues: [
      'This is a famous charity that you know of',
      'The place we first met in person',
      'Volunteers hand-pack meals that are sent to communities in need',
    ],
    message: 'Im glad to have met you in such a good hearted place!',
  },
  '2026-09-02': {
    word: 'COMPASS',
    clues: [
      'It only has one opinion, and it never changes it.',
      'Sailors trusted it long before they trusted maps.',
      'Its needle always finds north.',
    ],
    message: 'Placeholder note for day two.',
  },
  '2026-09-03': {
    word: 'LANTERN',
    clues: [
      'It carries something that would otherwise blow out.',
      'You hang it, or you swing it from a handle.',
      'A light you can take with you into the dark.',
    ],
  },
  '2026-09-04': {
    word: 'ORBIT',
    clues: [
      'Falling forever, and never landing.',
      'The moon has been doing it for four billion years.',
      'One full loop around something you cannot leave.',
    ],
    message: 'Placeholder note for day four.',
  },
  '2026-09-05': {
    word: 'HARBOR',
    clues: [
      'It is a place, and also something you do with a feeling.',
      'Boats come here when the weather turns.',
      'Sheltered water at the edge of a town.',
    ],
  },
  '2026-09-06': {
    word: 'ECHO',
    clues: [
      'It needs a wall to exist.',
      'Canyons are famous for handing it back to you.',
      'Your own voice, returned slightly late.',
    ],
  },
  '2026-09-07': {
    word: 'CINNAMON',
    clues: [
      'It is bark, technically.',
      'It shows up the moment the weather gets cold.',
      'Rolled into buns, dusted onto coffee.',
    ],
    message: 'Placeholder note for day seven.',
  },
  '2026-09-08': {
    word: 'POLAROID',
    clues: [
      'It develops in your hand while you wait.',
      'You are supposed to resist the urge to shake it.',
      'A square photo with a thick white border.',
    ],
  },
  '2026-09-09': {
    word: 'MONSOON',
    clues: [
      'It arrives on a schedule, roughly.',
      'A whole season defined by which way the wind blows.',
      'Months of rain that an entire subcontinent waits for.',
    ],
  },
  '2026-09-10': {
    word: 'KEEPSAKE',
    clues: [
      'Its value has nothing to do with its price.',
      'You would be upset to lose it and could not fully explain why.',
      'A small thing kept because of who it came from.',
    ],
    message: 'Placeholder note for day ten.',
  },

  // One per remaining month, so each month's colour scheme can be previewed
  // with a real puzzle on screen rather than an empty state.
  '2026-10-31': {
    word: 'COSTUME',
    clues: [
      'For one night it is more honest than what you usually wear.',
      'Half the fun is being guessed wrong.',
      'You knock on doors in it.',
    ],
    message: 'Placeholder note for Halloween.',
  },
  '2026-11-26': {
    word: 'GRATITUDE',
    clues: [
      'It is easiest to feel and hardest to say out loud.',
      'A whole holiday was built around remembering to.',
      'The feeling behind thank you.',
    ],
    message: 'Placeholder note for late November.',
  },
  '2026-12-25': {
    word: 'EVERGREEN',
    clues: [
      'It refuses to admit the season changed.',
      'It comes indoors once a year and gets covered in lights.',
      'A tree that stays green all winter.',
    ],
    message: 'Placeholder note for Christmas.',
  },
}

export interface WordDataIssue {
  date: string
  problem: string
}

/**
 * Checks the puzzle file rather than trusting it. A typo in a hand-written
 * 122-day list is likely, and it should surface as a clear message on the
 * affected day instead of a blank screen.
 */
export function validateEntry(entry: unknown): string | null {
  if (typeof entry !== 'object' || entry === null) return 'entry is not an object'
  const candidate = entry as Partial<DayEntry>
  if (typeof candidate.word !== 'string' || candidate.word.trim().length === 0) {
    return 'missing a word'
  }
  if (!Array.isArray(candidate.clues)) return 'missing its clues'
  if (candidate.clues.length !== 3) return `has ${candidate.clues.length} clues, expected 3`
  if (candidate.clues.some((clue) => typeof clue !== 'string' || clue.trim().length === 0)) {
    return 'has an empty clue'
  }
  if (candidate.message !== undefined && typeof candidate.message !== 'string') {
    return 'has a non-text message'
  }
  return null
}

/** Every malformed entry in the file, for the diagnostics panel in Settings. */
export function validateWordData(data: WordData = WORDS): WordDataIssue[] {
  return Object.entries(data)
    .map(([date, entry]) => ({ date, problem: validateEntry(entry) }))
    .filter((issue): issue is WordDataIssue => issue.problem !== null)
}

export type EntryResult =
  | { ok: true; entry: DayEntry }
  | { ok: false; reason: 'missing' | 'malformed'; detail: string }

export function getEntry(date: string, data: WordData = WORDS): EntryResult {
  const entry = data[date]
  if (entry === undefined) {
    return { ok: false, reason: 'missing', detail: `No puzzle is written for ${date} yet.` }
  }
  const problem = validateEntry(entry)
  if (problem) {
    return { ok: false, reason: 'malformed', detail: `The puzzle for ${date} ${problem}.` }
  }
  return { ok: true, entry }
}
