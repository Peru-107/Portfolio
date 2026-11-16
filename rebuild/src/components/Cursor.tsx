import { useEffect, useRef } from 'react'
import { gsap } from '../lib/motion'

// A dot that is exactly the pointer and a ring that trails it. Hovering
// anything with data-cursor shows that word inside the ring. Over Contact
// (ink) the blend switches so the cursor stays readable on dark paper.
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const host = root.current!
    const d = dot.current!
    const r = ring.current!
    // Snappier trail: dot sticks to the point; ring lags just enough to read as craft
    const dx = gsap.quickTo(d, 'x', { duration: 0.07, ease: 'power3' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.07, ease: 'power3' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.32, ease: 'power3' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.32, ease: 'power3' })
    let current: string | null = null
    let ink = false
    const move = (e: PointerEvent) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const t = (e.target as Element | null)?.closest?.('[data-cursor], a, button') as HTMLElement | null
      // Letter-roll links share the enlarged ring so scale and roll feel like one gesture
      const word = t ? (t.dataset.cursor ?? '') : null
      const state = word === null ? '' : word ? 'label' : 'link'
      if (word !== current) {
        current = word
        label.current!.textContent = word ?? ''
        r.dataset.state = state
      }
      const overInk = !!(e.target as Element | null)?.closest?.('.contact')
      if (overInk !== ink) {
        ink = overInk
        if (overInk) host.dataset.ink = ''
        else delete host.dataset.ink
      }
    }
    const leave = () => gsap.to([d, r], { autoAlpha: 0, duration: 0.2 })
    const enter = () => gsap.to([d, r], { autoAlpha: 1, duration: 0.2 })
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    return () => {
      removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])

  return (
    <div ref={root} className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
