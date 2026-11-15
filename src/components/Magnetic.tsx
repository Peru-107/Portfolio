import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/motion'

// Pulls its child toward the pointer while the pointer is near.
// Displacement is capped so magnets never yank across the header.
const CAP = 12

export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const n = el.current!
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const x = gsap.quickTo(n, 'x', { duration: 0.35, ease: 'power3.out' })
    const y = gsap.quickTo(n, 'y', { duration: 0.35, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      const r = n.getBoundingClientRect()
      let dx = (e.clientX - (r.left + r.width / 2)) * strength
      let dy = (e.clientY - (r.top + r.height / 2)) * strength
      const len = Math.hypot(dx, dy)
      if (len > CAP) {
        const k = CAP / len
        dx *= k
        dy *= k
      }
      x(dx)
      y(dy)
    }
    const out = () => (x(0), y(0))
    n.addEventListener('pointermove', move)
    n.addEventListener('pointerleave', out)
    return () => {
      n.removeEventListener('pointermove', move)
      n.removeEventListener('pointerleave', out)
    }
  }, [strength])
  return (
    <span ref={el} className="magnetic">
      {children}
    </span>
  )
}
