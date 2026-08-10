/**
 * A two-note chime synthesised with the Web Audio API — no audio file to ship
 * and nothing to load offline. Kept off by default: mobile browsers block
 * audio until a gesture anyway, and a surprise noise is a bad first impression.
 */
export function playSolveChime(enabled: boolean): void {
  if (!enabled || typeof window === 'undefined') return
  const AudioCtx = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return

  try {
    const ctx = new AudioCtx()
    const now = ctx.currentTime
    const notes = [
      { freq: 587.33, at: 0 },
      { freq: 880.0, at: 0.13 },
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0.0001, now + note.at)
      gain.gain.exponentialRampToValueAtTime(0.18, now + note.at + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.at + 0.5)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + note.at)
      osc.stop(now + note.at + 0.55)
    }

    window.setTimeout(() => void ctx.close(), 1200)
  } catch {
    // Audio is decoration; never let it surface as an error.
  }
}
