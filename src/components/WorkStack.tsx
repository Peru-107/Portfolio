import { useEffect, useRef } from 'react'
import { gsap, reduced } from '../lib/motion'
import { go } from '../lib/router'

// The work in depth: real screens fanned in 3D. The card that rises is the
// one chosen in the index beside it, or the card actually under the cursor.
export const STACK = [
  { src: '/media/stack-cube.webp', slug: 'cube', title: 'CUBE' },
  { src: '/media/stack-folio.webp', slug: 'folio', title: 'Folio' },
  { src: '/media/stack-tv.webp', slug: 'glass-home', title: 'Glass Home' },
  { src: '/media/stack-nextup.webp', slug: 'nextup', title: 'Nextup' },
  { src: '/media/stack-by.webp', slug: 'byperraz', title: 'byperraz engine' },
]

export function WorkStack({ active, onActive }: { active: number | null; onActive: (i: number | null) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current!
    gsap.set(stack.current, { rotationX: 12, rotationY: -22 })
    if (reduced()) return
    const rx = gsap.quickTo(stack.current, 'rotationX', { duration: 1.2, ease: 'power3' })
    const ry = gsap.quickTo(stack.current, 'rotationY', { duration: 1.2, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) return
      const nx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5))
      const ny = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5))
      ry(-22 + nx * 16)
      rx(12 - ny * 12)
    }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [])

  return (
    <div ref={root} className="ws" aria-hidden="true">
      <div ref={stack} className="ws__stack">
        {STACK.map((c, i) => (
          // The topmost card under the pointer gets the event, so what you
          // point at is what rises
          <div
            key={c.slug}
            className="ws__card"
            onPointerEnter={() => onActive(i)}
            onPointerLeave={() => onActive(null)}
            onClick={() => go(`/work/${c.slug}`)}
            data-active={active === i || undefined}
            data-cursor="Open"
            style={{ ['--i' as string]: i }}
          >
            <img src={c.src} alt="" />
          </div>
        ))}
      </div>
    </div>
  )
}
