import { useEffect, useLayoutEffect, useRef } from 'react'
import { site } from '../content'

// The signature at the foot of the page: the name set as wide as the page,
// with the things I've made stuck around it. Point at them and they shy away
// on springs, turning a little as they go, then settle back.

type Item = { label?: string; x: number; y: number; r: number; dot?: boolean; k?: number }
const ITEMS: Item[] = [
  { label: 'CUBE', x: 9, y: 16, r: -8 },
  { label: 'Nextup', x: 31, y: 6, r: 6, k: 1.2 },
  { dot: true, x: 22, y: 78, r: 0, k: 1.4 },
  { label: 'Folio', x: 47, y: 84, r: -5 },
  { label: 'Glass Home', x: 68, y: 10, r: 7, k: 0.9 },
  { dot: true, x: 60, y: 46, r: 0, k: 1.5 },
  { label: 'byperraz', x: 86, y: 74, r: -6, k: 1.1 },
  { label: 'Aegis, soon', x: 92, y: 22, r: 9, k: 0.8 },
]

export function Nudge() {
  const root = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLParagraphElement>(null)
  const els = useRef<(HTMLSpanElement | null)[]>([])

  // The name fills the width exactly
  useLayoutEffect(() => {
    const w = word.current!
    const fit = () => {
      w.style.fontSize = '100px'
      const natural = w.offsetWidth
      const room = root.current!.clientWidth
      w.style.fontSize = `${(room * 0.99 * 100) / Math.max(1, natural)}px`
    }
    fit()
    document.fonts.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(root.current!)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const host = root.current!
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const bodies = ITEMS.map(() => ({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 }))
    let pointer: { x: number; y: number } | null = null
    let raf = 0
    let last = 0

    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min(Math.max((now - last) / 1000, 1 / 240), 1 / 30) : 1 / 60
      last = now
      const w = host.clientWidth
      const h = host.clientHeight
      const scale = Math.min(Math.max(w / 1200, 0.5), 1.4)
      let moving = false
      bodies.forEach((b, i) => {
        const it = ITEMS[i]!
        let tx = 0
        let ty = 0
        let tr = 0
        if (pointer) {
          let dx = (w * it.x) / 100 - pointer.x
          let dy = (h * it.y) / 100 - pointer.y
          const len = Math.hypot(dx, dy)
          const range = 200 * scale
          if (len < range) {
            if (len < 0.1) (dx = Math.cos(i * 2.4)), (dy = Math.sin(i * 2.4))
            const force = Math.pow(1 - len / range, 1.35) * 120 * scale * (it.k ?? 1)
            const d = Math.max(len, 1)
            tx = (dx / d) * force
            ty = (dy / d) * force
            tr = Math.max(-1, Math.min(1, (tx - ty * 0.25) / (120 * scale))) * 14
          }
        }
        // A spring towards the pushed-away spot, with friction
        const friction = Math.exp(-14 * dt)
        b.vx = (b.vx + (tx - b.x) * 150 * dt) * friction
        b.vy = (b.vy + (ty - b.y) * 150 * dt) * friction
        b.vr = (b.vr + (tr - b.r) * 150 * dt) * friction
        b.x += b.vx * dt
        b.y += b.vy * dt
        b.r += b.vr * dt
        if (Math.abs(b.vx) + Math.abs(b.vy) + Math.abs(b.x - tx) + Math.abs(b.y - ty) > 0.05) moving = true
        const el = els.current[i]
        if (el) el.style.transform = `translate(-50%, -50%) translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) rotate(${(it.r + b.r).toFixed(2)}deg)`
      })
      if (moving || pointer) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const wake = () => (raf ||= requestAnimationFrame(tick))
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top }
      wake()
    }
    const leave = () => {
      pointer = null
      wake()
    }
    host.addEventListener('pointermove', move)
    host.addEventListener('pointerleave', leave)
    return () => {
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={root} className="nudge" aria-hidden="true">
      <p ref={word} className="nudge__word">{site.name}</p>
      {ITEMS.map((it, i) => (
        <span
          key={i}
          ref={(el) => void (els.current[i] = el)}
          className={it.dot ? 'nudge__dot' : 'nudge__tag'}
          style={{ left: `${it.x}%`, top: `${it.y}%`, transform: `translate(-50%, -50%) rotate(${it.r}deg)` }}
        >
          {it.label}
        </span>
      ))}
    </div>
  )
}
