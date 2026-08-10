/**
 * Guess matching is deliberately forgiving: case, accents, punctuation,
 * stray whitespace and even an internal space ("sun set" vs "sunset") all
 * pass. Losing a day to a typo would be a miserable way to break a streak.
 */
export function normalizeGuess(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Same as normalizeGuess but with spacing removed entirely. */
function compact(input: string): string {
  return normalizeGuess(input).replace(/ /g, '')
}

export function isCorrectGuess(guess: string, answer: string): boolean {
  const g = compact(guess)
  if (g.length === 0) return false
  return g === compact(answer)
}
