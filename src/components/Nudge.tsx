import { useEffect, useRef, useState } from 'react'

// The foot of the page is a pad of ink. It invites you to build something;
// tap it and it switches on, then press and drag to draw, like a pen. Each
// stroke goes down fiery yellow, warms through ember to magma orange, then
// fades as a whole. The things I've made are stuck on top; point at them and they shy
// away on springs, turning a little as they go, then settle back.

type Item = { label?: string; x: number; y: number; r: number; dot?: boolean; k?: number }
const ITEMS: Item[] = [
  { label: 'CUBE', x: 9, y: 16, r: -8 },
  { label: 'Nextup', x: 31, y: 6, r: 6, k: 1.2 },
  { dot: true, x: 22, y: 78, r: 0, k: 1.4 },
  { label: 'Folio', x: 47, y: 84, r: -5 },
  { label: 'Glass Home', x: 68, y: 10, r: 7, k: 0.9 },
  { dot: true, x: 78, y: 62, r: 0, k: 1.5 },
  { label: 'byperraz', x: 84, y: 94, r: -6, k: 1.1 },
  { label: 'Aegis, soon', x: 92, y: 4, r: 9, k: 0.8 },
]

// A point on a stroke: where, when it was laid, and how wide the brush was there
type Dot = { x: number; y: number; t: number; w: number; start: boolean; splash?: Splash }
// The splash a nib leaves where it lands: a ragged blot, and flicks thrown out
// from it (each a hairline tail ending in a teardrop)
type Splash = { blot: [number, number][]; flicks: { a: number; off: number; len: number; r: number }[] }

function splashAt(): Splash {
  // The blot: a rough circle whose edge bursts out in a few sharp spikes
  const base = 4 + Math.random() * 3
  const spikes = Array.from({ length: 5 + Math.floor(Math.random() * 5) }, () => ({ a: Math.random() * Math.PI * 2, l: 3 + Math.random() * 9 }))
  const blot: [number, number][] = []
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2
    let r = base * (0.85 + Math.random() * 0.25)
    for (const sp of spikes) {
      const d = Math.atan2(Math.sin(a - sp.a), Math.cos(a - sp.a))
      r += sp.l * Math.exp(-((d / 0.09) ** 2))
    }
    blot.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  // The flicks: mostly thrown one way, as a flick of the pen would
  const lean = Math.random() * Math.PI * 2
  const flicks = Array.from({ length: 4 + Math.floor(Math.random() * 4) }, () => ({
    a: lean + (Math.random() - 0.5) * 2.2,
    off: base * (0.6 + Math.random() * 0.6),
    len: 10 + Math.random() * 30,
    r: 0.8 + Math.random() * 2,
  }))
  return { blot, flicks }
}
const NIB = -Math.PI / 4 // a broad nib held at 45 degrees, as in calligraphy
const LIFE = 5.2 // seconds from wet to gone

// Colour of the ink at an age (0 = just laid, 1 = gone): fiery yellow, warming
// through ember to magma orange, which then fades away
function inkAt(age: number): [number, number, number, number] {
  const k = Math.min(1, age)
  const stops: [number, number, number][] = [[255, 228, 92], [255, 168, 48], [255, 92, 28]]
  const f = Math.min(stops.length - 1.001, (k / 0.6) * (stops.length - 1))
  const i = Math.floor(f)
  const t = f - i
  const c = stops[i]!.map((v, j) => Math.round(v + (stops[i + 1]![j]! - v) * t)) as [number, number, number]
  return [...c, k < 0.65 ? 1 : 1 - (k - 0.65) / 0.35]
}

export function Nudge() {
  const root = useRef<HTMLDivElement>(null)
  const pad = useRef<HTMLCanvasElement>(null)
  const els = useRef<(HTMLSpanElement | null)[]>([])
  const [active, setActive] = useState(false)

  // Drawing: nothing on hover. A tap switches the pad on; then pressing and
  // dragging (mouse held, or a finger) lays ink
  useEffect(() => {
    const host = root.current!
    const c = pad.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const dots: Dot[] = []
    let raf = 0
    let last: { x: number; y: number; t: number; w: number } | null = null

    const size = () => {
      c.width = Math.round(c.clientWidth * dpr)
      c.height = Math.round(c.clientHeight * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    const ro = new ResizeObserver(size)
    ro.observe(c)

    const draw = () => {
      raf = 0
      const now = performance.now() / 1000
      // Strokes, each from its first point to the one before the next stroke starts
      const strokes: Dot[][] = []
      for (const d of dots) {
        if (d.start || !strokes.length) strokes.push([d])
        else strokes[strokes.length - 1]!.push(d)
      }
      // A whole stroke ages from the moment it was finished, and goes all at once
      const kept = strokes.filter((st) => now - st[st.length - 1]!.t < LIFE)
      dots.length = 0
      kept.forEach((st) => dots.push(...st))
      ctx.clearRect(0, 0, c.clientWidth, c.clientHeight)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // Like a calligraphy pen: a splash where the nib lands, then one crisp line
      // whose width follows the nib, with a glow that hugs it. It curves through the
      // midpoints of its points, so the whole line cools and fades together,
      // like ink drying; segments follow the nib's width as it was drawn
      for (const st of kept) {
        const age = (now - st[st.length - 1]!.t) / LIFE
        const [r, g, bl, al] = inkAt(age)
        // The splash at the start of the stroke, glowing like the line
        const head = st[0]!
        if (head.splash) {
          ctx.save()
          ctx.translate(head.x, head.y)
          ctx.shadowColor = `rgba(${r}, ${g}, ${bl}, ${al * 0.85})`
          ctx.shadowBlur = 8
          ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${al})`
          const { blot, flicks } = head.splash
          ctx.beginPath()
          ctx.moveTo(blot[0]![0], blot[0]![1])
          for (const [px, py] of blot) ctx.lineTo(px, py)
          ctx.closePath()
          ctx.fill()
          // Each flick: a hairline from the blot that swells into a teardrop
          for (const f of flicks) {
            const c = Math.cos(f.a)
            const sn = Math.sin(f.a)
            const ex = c * (f.off + f.len)
            const ey = sn * (f.off + f.len)
            ctx.beginPath()
            ctx.moveTo(c * f.off - sn * 0.4, sn * f.off + c * 0.4)
            ctx.lineTo(ex - sn * f.r, ey + c * f.r)
            ctx.arc(ex, ey, f.r, f.a + Math.PI / 2, f.a - Math.PI / 2, true)
            ctx.lineTo(c * f.off + sn * 0.4, sn * f.off - c * 0.4)
            ctx.closePath()
            ctx.fill()
          }
          ctx.restore()
        }
        if (st.length < 2) continue
        // A tight glow first: the whole stroke as one path, lit by a short shadow
        // of its own colour, so the light hugs the line instead of haloing it
        ctx.save()
        ctx.shadowColor = `rgba(${r}, ${g}, ${bl}, ${al * 0.85})`
        ctx.shadowBlur = 8
        ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${al})`
        ctx.lineWidth = st.reduce((sum, d) => sum + d.w, 0) / st.length
        ctx.beginPath()
        ctx.moveTo(st[0]!.x, st[0]!.y)
        for (let i = 1; i < st.length; i++) ctx.quadraticCurveTo(st[i - 1]!.x, st[i - 1]!.y, (st[i - 1]!.x + st[i]!.x) / 2, (st[i - 1]!.y + st[i]!.y) / 2)
        ctx.stroke()
        ctx.restore()
        ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${al})`
        for (let i = 1; i < st.length; i++) {
          const p0 = st[i - 1]!
          const p1 = st[i]!
          const z = st[i - 2]
          ctx.beginPath()
          ctx.moveTo(z ? (z.x + p0.x) / 2 : p0.x, z ? (z.y + p0.y) / 2 : p0.y)
          ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2)
          if (i === st.length - 1) ctx.lineTo(p1.x, p1.y)
          ctx.lineWidth = p1.w
          ctx.stroke()
        }
      }
      ctx.globalCompositeOperation = 'source-over'
      if (dots.length) raf = requestAnimationFrame(draw)
    }
    const wake = () => (raf ||= requestAnimationFrame(draw))

    let on = false
    const lay = (e: PointerEvent) => {
      if (!on || e.buttons === 0) return
      const r = c.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const t = performance.now() / 1000
      // A fresh stroke after a pause or a jump; otherwise faster means a thinner line
      const start = !last || t - last.t > 0.12 || Math.hypot(x - last.x, y - last.y) > 120
      const speed = last && !start ? Math.hypot(x - last.x, y - last.y) / Math.max(t - last.t, 1 / 240) : 0
      // Calligraphy: across the nib's edge the line is full, along it a hairline;
      // moving fast thins it a little more, as ink runs short
      const ang = last && !start ? Math.atan2(y - last.y, x - last.x) : NIB + Math.PI / 2
      const broad = Math.abs(Math.sin(ang - NIB))
      const raw = (1.4 + 8 * broad) * Math.max(0.55, 1 - speed / 2600)
      // Eased into the last width, so the line swells and thins smoothly
      const w = last && !start ? last.w * 0.6 + raw * 0.4 : raw
      // Where the nib first touches, the ink splashes
      const splash = start ? splashAt() : undefined
      dots.push({ x, y, t, w, start, splash })
      if (dots.length > 1600) dots.splice(0, dots.length - 1600)
      last = { x, y, t, w }
      wake()
    }
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (!on) {
        on = true
        setActive(true)
      }
      host.setPointerCapture(e.pointerId)
      last = null
      lay(e)
    }
    const lift = () => void (last = null)
    host.addEventListener('pointerdown', down)
    host.addEventListener('pointermove', lay)
    host.addEventListener('pointerleave', lift)
    host.addEventListener('pointerup', lift)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(raf)
      host.removeEventListener('pointerdown', down)
      host.removeEventListener('pointermove', lay)
      host.removeEventListener('pointerleave', lift)
      host.removeEventListener('pointerup', lift)
    }
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
    <div ref={root} className="nudge" aria-hidden="true" data-active={active || undefined}>
      <canvas ref={pad} className="nudge__pad" />
      <div className="nudge__hint" data-gone={active || undefined}>
        <p>Let’s build something</p>
        <span>Tap to draw</span>
      </div>
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
