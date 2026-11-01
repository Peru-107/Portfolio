import { useEffect, useRef } from 'react'
import { gsap } from '../lib/motion'

// A dot that is exactly the pointer and a ring that trails it. Hovering
// anything with data-cursor shows that word inside the ring.
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    document.documentElement.classList.add('has-cursor')
    const d = dot.current!
    const r = ring.current!
    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3' })
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.45, ease: 'power3' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.45, ease: 'power3' })
    let current: string | null = null
    const move = (e: PointerEvent) => {
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const t = (e.target as Element | null)?.closest?.('[data-cursor], a, button') as HTMLElement | null
      const word = t ? t.dataset.cursor ?? '' : null
      if (word !== current) {
        current = word
        label.current!.textContent = word ?? ''
        r.dataset.state = word === null ? '' : word ? 'label' : 'link'
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
    <div className="cursor" aria-hidden="true">
      <div ref={ring} className="cursor__ring">
        <span ref={label} className="cursor__label" />
      </div>
      <div ref={dot} className="cursor__dot" />
    </div>
  )
}
