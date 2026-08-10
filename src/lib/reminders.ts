/**
 * Daily reminders, with honest limits.
 *
 * There is no backend, so there is no web push. What's possible is a local
 * notification fired by the page itself, which means it only fires while the
 * app is open or its service worker is alive. On Android and desktop that's
 * usually enough to catch her during the day. On iOS it is not: Safari has no
 * scheduled local notifications for web apps, and background execution stops
 * when the app is closed. The UI says so rather than pretending otherwise.
 *
 * The reliable half of the feature is `shouldNudge`, which drives the in-app
 * "today's word is waiting" state and works identically everywhere.
 */

const LAST_FIRED_KEY = 'wotd:reminder:lastFired'

export type ReminderSupport = 'supported' | 'unsupported-ios' | 'unsupported'

export function detectSupport(): ReminderSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const ua = navigator.userAgent
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as a Mac, distinguishable only by touch support.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (isIOS) return 'unsupported-ios'
  return 'supported'
}

export function permission(): NotificationPermission | 'unavailable' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unavailable'
  return Notification.permission
}

export async function requestPermission(): Promise<NotificationPermission | 'unavailable'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unavailable'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/** True when the reminder time has passed today and today's puzzle is unplayed. */
export function isReminderDue(
  reminderTime: string | null,
  playedToday: boolean,
  now: Date = new Date(),
): boolean {
  if (!reminderTime || playedToday) return false
  const [hours, minutes] = reminderTime.split(':').map(Number)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false
  const due = new Date(now)
  due.setHours(hours, minutes, 0, 0)
  return now >= due
}

function todayKey(now: Date): string {
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
}

/** Fires at most one reminder per calendar day. */
export function maybeNotify(
  reminderTime: string | null,
  playedToday: boolean,
  now: Date = new Date(),
): boolean {
  if (permission() !== 'granted') return false
  if (!isReminderDue(reminderTime, playedToday, now)) return false
  try {
    if (localStorage.getItem(LAST_FIRED_KEY) === todayKey(now)) return false
    new Notification('Word of the Day', {
      body: "Today's word is waiting for you.",
      tag: 'wotd-daily',
    })
    localStorage.setItem(LAST_FIRED_KEY, todayKey(now))
    return true
  } catch {
    return false
  }
}
