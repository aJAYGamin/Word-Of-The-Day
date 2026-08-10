import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#d1603d', '#e0a458', '#6f8f72', '#b3564b', '#8c6c9a']

/**
 * A short burst of falling paper on a solve. Pure CSS transforms so it costs
 * nothing on a phone, and it opts out entirely under reduced-motion.
 */
export function Confetti({ active }: { active: boolean }) {
  const [visible, setVisible] = useState(false)

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (!active || reduceMotion) return
    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), 2600)
    return () => window.clearTimeout(id)
  }, [active, reduceMotion])

  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.1,
        rotate: Math.random() * 360,
        color: COLORS[i % COLORS.length],
        width: 6 + Math.random() * 6,
        height: 9 + Math.random() * 8,
      })),
    // A fresh set of pieces each time the burst starts.
    [visible],
  )

  if (!visible) return null

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti__piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            background: piece.color,
            width: piece.width,
            height: piece.height,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
