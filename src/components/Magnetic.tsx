import { useEffect, useRef, type ReactNode } from 'react'
import { gsap } from '../lib/motion'

// Pulls its child toward the pointer while the pointer is near
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const n = el.current!
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const x = gsap.quickTo(n, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.45)' })
    const y = gsap.quickTo(n, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.45)' })
    const move = (e: PointerEvent) => {
      const r = n.getBoundingClientRect()
      x((e.clientX - (r.left + r.width / 2)) * strength)
      y((e.clientY - (r.top + r.height / 2)) * strength)
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
