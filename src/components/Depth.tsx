import { useEffect, useRef, useState } from 'react'
import { gsap, reduced } from '../lib/motion'
import { tick } from '../lib/haptic'

// A project's screens in depth: the one in front is sharp and square to you,
// the rest step back to either side, turning away, shrinking and softening
// out of focus. Drag it, swipe it with a trackpad, use the arrows or the
// keyboard; it always settles on one screen.

export type Shot = { src: string; alt: string }

const SIDE = 0.7 // scale of the cards beside the front one
const DEPTH = 170 // px each step goes back
const TURN = 20 // degrees the side cards turn away
const BLUR = 6

export function Depth({ shots, label }: { shots: Shot[]; label: string }) {
  const stage = useRef<HTMLDivElement>(null)
  const cards = useRef<(HTMLDivElement | null)[]>([])
  const [active, setActive] = useState(0)
  const pos = useRef({ p: 0, target: 0 })
  const n = shots.length

  // Places every card for a progress value p (0 = first screen in front)
  const render = () => {
    const st = stage.current
    if (!st) return
    const w = cards.current[0]?.offsetWidth ?? 400
    const first = w * 0.46 + 40
    const step = w * SIDE * 0.62
    cards.current.forEach((c, i) => {
      if (!c) return
      const o = i - pos.current.p
      const a = Math.abs(o)
      const x = a <= 1 ? o * first : Math.sign(o) * (first + (a - 1) * step)
      const z = -Math.min(a, 4) * DEPTH
      const r = -Math.max(-1, Math.min(1, o)) * TURN
      const s = 1 - (1 - SIDE) * Math.min(a, 1)
      const op = 1 - Math.min(Math.max(a - 3, 0) / 1.3, 1)
      const b = Math.min(Math.max(a - 0.35, 0) * 2.6, BLUR)
      c.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${r.toFixed(2)}deg) scale(${s.toFixed(3)})`
      c.style.opacity = op.toFixed(3)
      c.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none'
      c.style.zIndex = String(Math.round(1000 - a * 10))
    })
  }

  const goTo = (t: number, instant = false) => {
    const target = Math.max(0, Math.min(n - 1, t))
    const changed = Math.round(target) !== Math.round(pos.current.target)
    pos.current.target = target
    setActive(Math.round(target))
    if (changed) tick()
    gsap.to(pos.current, { p: target, duration: instant || reduced() ? 0 : 0.7, ease: 'power3.out', overwrite: true, onUpdate: render })
  }

  useEffect(() => {
    const st = stage.current!
    render()
    const ro = new ResizeObserver(render)
    ro.observe(st)

    // Drag: follows the hand, then a flick carries on and it settles on a screen
    let down = false
    let startX = 0
    let startP = 0
    let lastX = 0
    let lastT = 0
    let vel = 0
    const per = () => Math.max(120, (cards.current[0]?.offsetWidth ?? 400) * 0.55)
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      down = true
      startX = lastX = e.clientX
      startP = pos.current.p
      lastT = performance.now()
      vel = 0
      st.setPointerCapture(e.pointerId)
      gsap.killTweensOf(pos.current)
    }
    const onMove = (e: PointerEvent) => {
      if (!down) return
      const now = performance.now()
      pos.current.p = Math.max(-0.3, Math.min(n - 0.7, startP - (e.clientX - startX) / per()))
      if (now > lastT) vel = (e.clientX - lastX) / (now - lastT)
      lastX = e.clientX
      lastT = now
      render()
    }
    const onUp = () => {
      if (!down) return
      down = false
      goTo(Math.round(pos.current.p - vel * 0.35))
    }
    // Trackpads: only sideways swipes move it, so the page still scrolls normally
    let snap = 0
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 0.5) return
      e.preventDefault()
      gsap.killTweensOf(pos.current)
      pos.current.p = Math.max(0, Math.min(n - 1, pos.current.p + e.deltaX * 0.0055))
      render()
      window.clearTimeout(snap)
      snap = window.setTimeout(() => goTo(Math.round(pos.current.p)), 160)
    }
    st.addEventListener('pointerdown', onDown)
    st.addEventListener('pointermove', onMove)
    st.addEventListener('pointerup', onUp)
    st.addEventListener('pointercancel', onUp)
    st.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      ro.disconnect()
      window.clearTimeout(snap)
      gsap.killTweensOf(pos.current)
      st.removeEventListener('pointerdown', onDown)
      st.removeEventListener('pointermove', onMove)
      st.removeEventListener('pointerup', onUp)
      st.removeEventListener('pointercancel', onUp)
      st.removeEventListener('wheel', onWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n])

  return (
    <div
      className="depth"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') (e.preventDefault(), goTo(active + 1))
        if (e.key === 'ArrowLeft') (e.preventDefault(), goTo(active - 1))
      }}
    >
      <div ref={stage} className="depth__stage" data-cursor="Drag">
        {shots.map((s, i) => (
          <div
            key={s.src}
            ref={(el) => void (cards.current[i] = el)}
            className="depth__card"
            aria-hidden={i !== active}
            onClick={() => i !== active && goTo(i)}
          >
            <img src={s.src} alt={s.alt} draggable={false} loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
      <div className="depth__bar">
        <p className="depth__count" aria-live="polite">
          {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          <span className="sr-only">: {shots[active]?.alt}</span>
        </p>
        <div className="depth__nav">
          <button type="button" aria-label="Previous screen" disabled={active === 0} onClick={() => goTo(active - 1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4M9.5 4.5 4 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
          <button type="button" aria-label="Next screen" disabled={active === n - 1} onClick={() => goTo(active + 1)}>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M10.5 4.5 16 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
