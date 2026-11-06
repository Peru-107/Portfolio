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
const LIFE = 5.2 // seconds from wet to gone
const NIB = -Math.PI / 4 // a broad nib held at 45 degrees, as in calligraphy

// The splash a nib leaves where it lands, sumi-e style: an uneven blot thrown
// one way, flicks with ragged drops at their ends, and irregular spatter
type Shape = [number, number][]
type Splash = { blot: Shape; flicks: { tail: Shape; drop: Shape }[]; spatter: Shape[] }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

// A rough, lopsided shape: a circle bent by a few random waves, then
// stretched along `dir`, so no two drops are alike and none is round
function blob(cx: number, cy: number, r: number, dir: number, stretch: number, rough = 0.35, n = 18): Shape {
  const waves = Array.from({ length: 4 }, (_, i) => ({ k: i + 2, amp: rand(0.05, rough), ph: rand(0, Math.PI * 2) }))
  const c = Math.cos(dir)
  const s = Math.sin(dir)
  const pts: Shape = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    let rr = r * (1 + waves.reduce((sum, w) => sum + w.amp * Math.sin(w.k * a + w.ph), 0))
    rr *= rand(0.92, 1.08)
    const u = Math.cos(a) * rr * stretch
    const v = Math.sin(a) * rr
    pts.push([cx + u * c - v * s, cy + u * s + v * c])
  }
  return pts
}

function splashAt(): Splash {
  const lean = rand(0, Math.PI * 2)
  const base = rand(3.5, 7)
  // The blot, uneven and thrown one way, with a few sharp tongues of ink
  const blot = blob(0, 0, base, lean, rand(1.2, 1.8), 0.4, 40)
  const tongues = Array.from({ length: 2 + Math.floor(Math.random() * 4) }, () => ({ a: lean + rand(-1.3, 1.3), l: rand(3, 14), w: rand(0.05, 0.16) }))
  blot.forEach((p) => {
    const a = Math.atan2(p[1], p[0])
    let push = 0
    for (const t of tongues) {
      const d = Math.atan2(Math.sin(a - t.a), Math.cos(a - t.a))
      push += t.l * Math.exp(-((d / t.w) ** 2))
    }
    const len = Math.hypot(p[0], p[1]) || 1
    p[0] += (p[0] / len) * push
    p[1] += (p[1] / len) * push
  })
  // Flicks: a slightly curved hairline from the blot to a ragged drop
  const flicks = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
    const a = lean + rand(-0.9, 0.9)
    const from = base * rand(0.8, 1.2)
    const to = from + rand(14, 42)
    const bend = rand(-6, 6)
    const c = Math.cos(a)
    const s = Math.sin(a)
    const r = rand(1.2, 2.8)
    const mid = (from + to) / 2
    const tail: Shape = [
      [c * from - s * 0.5, s * from + c * 0.5],
      [c * mid - s * (bend + r * 0.35), s * mid + c * (bend + r * 0.35)],
      [c * to - s * r * 0.7, s * to + c * r * 0.7],
      [c * to + s * r * 0.7, s * to - c * r * 0.7],
      [c * mid - s * (bend - r * 0.35), s * mid + c * (bend - r * 0.35)],
      [c * from + s * 0.5, s * from - c * 0.5],
    ]
    return { tail, drop: blob(c * to, s * to, r, a, rand(1.1, 1.7)) }
  })
  // Spatter: drops of very different sizes, most close, a few flung far
  const spatter = Array.from({ length: 6 + Math.floor(Math.random() * 9) }, () => {
    const a = Math.random() < 0.75 ? lean + rand(-1.4, 1.4) : rand(0, Math.PI * 2)
    const d = base + Math.pow(Math.random(), 1.8) * 55
    const r = Math.max(0.5, rand(0.4, 2.6) * (1 - d / 90))
    return blob(Math.cos(a) * d, Math.sin(a) * d, r, a, rand(1, 2.2), 0.3, 9)
  })
  return { blot, flicks, spatter }
}

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
          const { blot, flicks, spatter } = head.splash
          // Every shape is traced through the midpoints of its corners, so edges are soft but never round
          const trace = (pts: Shape) => {
            const n = pts.length
            ctx.beginPath()
            ctx.moveTo((pts[n - 1]![0] + pts[0]![0]) / 2, (pts[n - 1]![1] + pts[0]![1]) / 2)
            for (let i = 0; i < n; i++) {
              const p = pts[i]!
              const q = pts[(i + 1) % n]!
              ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
            }
            ctx.closePath()
            ctx.fill()
          }
          trace(blot)
          for (const f of flicks) {
            trace(f.tail)
            trace(f.drop)
          }
          spatter.forEach(trace)
          ctx.restore()
        }
        if (st.length < 2) continue
        // The path, smoothed: points along curves through the midpoints of the samples
        const path: { x: number; y: number; w: number }[] = [st[0]!]
        for (let i = 1; i < st.length; i++) {
          const p0 = st[i - 1]!
          const p1 = st[i]!
          const z = st[i - 2]
          const ax = z ? (z.x + p0.x) / 2 : p0.x
          const ay = z ? (z.y + p0.y) / 2 : p0.y
          const bx = (p0.x + p1.x) / 2
          const by = (p0.y + p1.y) / 2
          for (let k = 1; k <= 4; k++) {
            const t = k / 4
            const u = 1 - t
            path.push({ x: u * u * ax + 2 * u * t * p0.x + t * t * bx, y: u * u * ay + 2 * u * t * p0.y + t * t * by, w: p0.w + (p1.w - p0.w) * t })
          }
        }
        path.push(st[st.length - 1]!)
        // A broad, flat nib held at 45 degrees, swept along the path: every step
        // adds the parallelogram the nib's edge passes over. Moving across the edge
        // lays a full stroke, moving along it a hairline, and the ends come out
        // cut on the angle, as with a real calligraphy pen. One fill, so nothing doubles
        const nx = Math.cos(NIB)
        const ny = Math.sin(NIB)
        ctx.save()
        ctx.shadowColor = `rgba(${r}, ${g}, ${bl}, ${al * 0.85})`
        ctx.shadowBlur = 7
        ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${al})`
        ctx.beginPath()
        for (let i = 1; i < path.length; i++) {
          const p0 = path[i - 1]!
          const p1 = path[i]!
          const h0 = 6.5 * p0.w
          const h1 = 6.5 * p1.w
          ctx.moveTo(p0.x + nx * h0, p0.y + ny * h0)
          ctx.lineTo(p1.x + nx * h1, p1.y + ny * h1)
          ctx.lineTo(p1.x - nx * h1, p1.y - ny * h1)
          ctx.lineTo(p0.x - nx * h0, p0.y - ny * h0)
          ctx.closePath()
        }
        ctx.fill('nonzero')
        ctx.restore()
        // The hairline the nib's edge leaves, so the thinnest strokes never vanish
        ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${al})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(path[0]!.x, path[0]!.y)
        for (const q of path) ctx.lineTo(q.x, q.y)
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'source-over'
      if (dots.length) raf = requestAnimationFrame(draw)
    }
    const wake = () => (raf ||= requestAnimationFrame(draw))

    let on = false
    // Five quiet seconds after the last stroke, the pad rests and invites again
    let rest = 0
    const restSoon = () => {
      window.clearTimeout(rest)
      rest = window.setTimeout(() => {
        on = false
        setActive(false)
      }, 5000)
    }
    const lay = (e: PointerEvent) => {
      if (!on || e.buttons === 0) return
      restSoon()
      const r = c.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      const t = performance.now() / 1000
      // A fresh stroke after a pause or a jump; otherwise faster means a thinner line
      const start = !last || t - last.t > 0.12 || Math.hypot(x - last.x, y - last.y) > 120
      const speed = last && !start ? Math.hypot(x - last.x, y - last.y) / Math.max(t - last.t, 1 / 240) : 0
      // The nib's reach: full at a steady hand, a little less when moving fast,
      // as the ink runs short; eased so the stroke never jumps in weight
      const raw = Math.max(0.6, 1 - speed / 2600)
      const w = last && !start ? last.w * 0.7 + raw * 0.3 : raw
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
      restSoon()
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
      window.clearTimeout(rest)
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
