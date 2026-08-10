/**
 * The app is dressed for the month she's looking at: harvest gold in
 * September, pumpkin and plum in October, cranberry in November, evergreen
 * and frost in December. Lavender runs underneath all four so the app still
 * reads as one thing across the season.
 */
export type MonthTheme = '9' | '10' | '11' | '12' | 'default'

export function monthTheme(date: string): MonthTheme {
  const month = Number(date.slice(5, 7))
  switch (month) {
    case 9:
    case 10:
    case 11:
    case 12:
      return String(month) as MonthTheme
    default:
      // Anything outside the season (including August, before it starts)
      // falls back to the lavender-forward base palette.
      return 'default'
  }
}

/** Browser chrome colour for each palette, matched to the page background. */
const CHROME: Record<MonthTheme, string> = {
  '9': '#f6f1f7',
  '10': '#f4eff7',
  '11': '#f5eff5',
  '12': '#eef1f8',
  default: '#f3f0fa',
}

export function applyTheme(date: string): MonthTheme {
  const theme = monthTheme(date)
  if (typeof document === 'undefined') return theme

  document.documentElement.dataset.month = theme
  const meta = document.querySelector('meta[name="theme-color"]:not([media])')
  if (meta) meta.setAttribute('content', CHROME[theme])
  return theme
}
