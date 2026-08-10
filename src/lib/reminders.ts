/**
 * Daily reminders, with honest limits.
 *
 * There is no backend, so there is no web push. What's possible is a local
 * notification fired by the page itself, which means the app has to be running
 * — a tab, or the installed window — for the reminder to arrive.
 *
 * On desktop that is a reasonable ask: browsers stay open, and an installed
 * app can be set to launch at login, at which point the reminder is genuinely
 * dependable. On iOS it is not: Safari cannot schedule local notifications for
 * web apps and stops executing entirely once the app is closed, so the toggle
 * says so instead of quietly doing nothing.
 *
 * `isReminderDue` is the part that works everywhere — it also drives the
 * in-app nudge, which needs no permission and no notification at all.
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

/** True when the app is running as an installed window rather than a tab. */
export function isInstalled(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
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

/** Shows a notification that focuses the app when clicked. */
function show(title: string, body: string, tag: string): boolean {
  try {
    const notification = new Notification(title, { body, tag, icon: './icon-192.png' })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
    return true
  } catch {
    return false
  }
}

/** Fires immediately, so the reminder can be verified rather than trusted. */
export function sendTestNotification(): boolean {
  if (permission() !== 'granted') return false
  return show('Word of the Day', "This is what your daily reminder will look like.", 'wotd-test')
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

export function alreadyFiredToday(now: Date = new Date()): boolean {
  try {
    return localStorage.getItem(LAST_FIRED_KEY) === todayKey(now)
  } catch {
    return false
  }
}

/**
 * Fires at most one reminder per calendar day, and never while she is already
 * looking at the app — a notification for something on screen is just noise.
 */
export function maybeNotify(
  reminderTime: string | null,
  playedToday: boolean,
  now: Date = new Date(),
): boolean {
  if (permission() !== 'granted') return false
  if (!isReminderDue(reminderTime, playedToday, now)) return false
  if (typeof document !== 'undefined' && document.visibilityState === 'visible' && document.hasFocus()) {
    return false
  }
  if (alreadyFiredToday(now)) return false

  if (!show('Word of the Day', "Today's word is waiting for you.", 'wotd-daily')) return false
  try {
    localStorage.setItem(LAST_FIRED_KEY, todayKey(now))
  } catch {
    // Failing to record it only risks a duplicate, which beats silence.
  }
  return true
}
