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
    message: 'I’m glad to have met you in such a good hearted place!',
  },
  '2026-09-02': {
    word: 'Hinge',
    clues: [
      'It’s designed to help two people connect with each other',
      'Popular app people use for dating',
      'Where we first talked to each other',
    ],
    message: 'I’m so glad you accepted my message that day and you are such a blessing to my heart',
  },
  '2026-09-03': {
    word: 'DJ',
    clues: [
      'This person helps shape the atmosphere of a room through sound',
      'They often work with songs, beats, and transitions to keep people engaged',
      'This is the shortened name for the first movie we watched together',
    ],
    message: 'I love how each letter is our names! Its so cute!',
  },
  '2026-09-04': {
    word: 'University Valley Apartments',
    clues: [
      'It’s a place where many people live while being close to a busy academic and social environment',
      'It’s name combines an educational setting with a landscape feature',
      'The first apartment I lived in by myself',
    ],
    message: 'This is the first place you visited me at my place',
  },
  '2026-09-05': {
    word: 'Graduate Hotel',
    clues: [
      'A hotel in Tempe where people can stay many long nights in',
      'We have gone here with friends before',
      'The first place we kissed',
    ],
    message: 'I’m very grateful of this wonderful moment we had together. My red suit sucked though, should have worn something better',
  },
  '2026-09-06': {
    word: 'Zoom',
    clues: [
      'It’s commonly used for seeing and talking to other people through a screen',
      'Used a lot in meetings but didnt use it for that purpose',
      'This application is where we watched our first movie',
    ],
    message: 'I always loved our late night zoom talks and I would love continue them if Facetime didn’t exist',
  },
  '2026-09-07': {
    word: 'Shuttle',
    clues: [
      'It’s a way to get from one place to another on ASU campus',
      'We often use it to come see friends or each other',
      'Where we took our first picture',
    ],
    message: 'Even though we were friends, I loved this memory!',
  },
  '2026-09-08': {
    word: 'India',
    clues: [
      'This is a place you have visited before and your parents have been here recently',
      'You were born in the city of this place',
      'Where I always wanted to travel with you',
    ],
    message: 'I would love to do all the shopping with the baby here!',
  },
  '2026-09-09': {
    word: 'Chipotle',
    clues: [
      'It’s a place where you can customize your meal based on what you’re in the mood for',
      'Its food is inspired by Mexican flavors, and you’ll often see people ordering their meal one ingredient at a time',
      'One of our favorite places to eat',
    ],
    message: 'Chipotle is so yummy but its more yummy to eat with you!',
  },
  '2026-09-10': {
    word: 'Tamil',
    clues: [
      'One of the oldest languages in the world',
      'Something Im trying to learn but will take time for me to master',
      'The first language we will teach our kids',
    ],
    message: 'I cant wait to make you and your family happy with the Tamil I have learned',
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
