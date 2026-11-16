import { useEffect, useRef } from 'react'
import { InkField } from '../hero/fluid'
import { site } from '../content'
import { linkProps } from '../lib/router'

// One drop of ink for the whole page. A single fluid sits behind everything;
// the page decides its shape as you scroll: my name, then a market line that
// draws as you scroll, then "Say hello". The ink travels with the content,
// and fast scrolling smears it. Private preview: open /ink-story directly.

const PAPER: [number, number, number] = [0.914, 0.925, 0.937]
const INKS: [number, number, number][] = [
  [0.74, 0.73, 0.72],
  [0.0, 0.52, 0.86],
  [0.0, 0.22, 0.7],
  [0.72, 0.72, 0.71],
  [0.2, 0.82, 0.82],
  [0.0, 0.48, 0.84],
]
const S = 0.5 // the mask is drawn at half the screen's size

type Metrics = { ratio: number; ascent: number; glyphH: number; left: number }

export function InkStory() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const nameBox = useRef<HTMLDivElement>(null)
  const lineBox = useRef<HTMLDivElement>(null)
  const helloBox = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.title = 'Ink story (preview)'
    const c = canvas.current!
    const mask = document.createElement('canvas')
    const sizeMask = () => {
      mask.width = Math.max(2, Math.round(innerWidth * S))
      mask.height = Math.max(2, Math.round(innerHeight * S))
    }
    sizeMask()
    const ctx = mask.getContext('2d')!
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    // A rising market line: a seeded walk, so it's the same every visit
    let seed = 11
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const walk: number[] = []
    let v = 0.82
    for (let i = 0; i < 48; i++) {
      v += (rand() - 0.6) * 0.09
      v = Math.max(0.08, Math.min(0.92, v))
      walk.push(v)
    }

    const metrics = new Map<string, Metrics>()
    const measure = (text: string) => {
      if (!metrics.has(text)) {
        ctx.font = '800 100px Panchang, "Arial Black", sans-serif'
        const m = ctx.measureText(text)
        const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
        metrics.set(text, { ratio: m.width / glyphH, ascent: m.actualBoundingBoxAscent / 100, glyphH: glyphH / 100, left: m.actualBoundingBoxLeft / 100 })
      }
      return metrics.get(text)!
    }
    const visible = (r: DOMRect) => r.bottom > -innerHeight * 0.2 && r.top < innerHeight * 1.2

    // The word fills its box, exactly as the hero's ink word does
    const word = (text: string, r: DOMRect) => {
      const m = measure(text)
      const glyph = Math.min(r.height, r.width / m.ratio)
      const size = glyph / m.glyphH
      ctx.font = `800 ${size * S}px Panchang, "Arial Black", sans-serif`
      const y = r.top + (r.height - glyph) / 2 + m.ascent * size
      ctx.fillText(text, (r.left - m.left * size) * S, y * S)
    }

    let tip: { x: number; y: number; dx: number; dy: number } | null = null
    let lastProgress = 0
    const line = (r: DOMRect) => {
      // Drawn by your scrolling: it starts as the box enters, finishes near the middle of the screen
      const p = Math.max(0, Math.min(1, (innerHeight * 0.9 - r.top) / (innerHeight * 0.6 + r.height * 0.5)))
      const n = (walk.length - 1) * p
      if (n <= 0) return
      const at = (i: number) => ({ x: r.left + (i / (walk.length - 1)) * r.width, y: r.top + walk[i]! * r.height })
      ctx.lineWidth = Math.max(14, r.height * 0.1) * S
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const first = at(0)
      ctx.moveTo(first.x * S, first.y * S)
      const whole = Math.floor(n)
      for (let i = 1; i <= whole; i++) ctx.lineTo(at(i).x * S, at(i).y * S)
      const a = at(whole)
      const b = at(Math.min(walk.length - 1, whole + 1))
      const f = n - whole
      const end = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
      ctx.lineTo(end.x * S, end.y * S)
      ctx.stroke()
      tip = p > lastProgress + 0.001 ? { x: end.x, y: end.y, dx: b.x - a.x, dy: b.y - a.y } : null
      lastProgress = p
    }

    const draw = () => {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, mask.width, mask.height)
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#fff'
      const nb = nameBox.current!.getBoundingClientRect()
      if (visible(nb)) word(site.name, nb)
      const lb = lineBox.current!.getBoundingClientRect()
      tip = null
      if (visible(lb)) line(lb)
      const hb = helloBox.current!.getBoundingClientRect()
      if (visible(hb)) word('Say hello', hb)
    }

    let f: InkField
    try {
      draw()
      f = new InkField({ canvas: c, mask, paper: PAPER, inks: INKS, reducedMotion })
    } catch {
      return
    }
    f.outside = 0.14
    f.reveal = 1

    // Every frame: the shapes follow the page, and the line's growing tip is fed fresh ink
    let raf = 0
    const loop = () => {
      draw()
      f.maskChanged()
      if (tip) {
        const len = Math.hypot(tip.dx, tip.dy) || 1
        f.feed(tip.x / innerWidth, 1 - tip.y / innerHeight, (tip.dx / len) * 260, (-tip.dy / len) * 260, 0.9, 0.004)
      }
      raf = requestAnimationFrame(loop)
    }

    document.fonts.load('800 100px Panchang').then(() => {
      metrics.clear()
      draw()
      f.refreshMask()
      f.start()
      f.pour()
      loop()
    })

    // Scrolling moves the ink with the page; fast scrolls smear it
    let lastY = scrollY
    const onScroll = () => {
      f.scroll(scrollY - lastY)
      lastY = scrollY
    }
    addEventListener('scroll', onScroll, { passive: true })

    // Stir, click to drop ink, press and drag to pull it like taffy
    let lastMove = performance.now()
    const move = (e: PointerEvent) => {
      lastMove = performance.now()
      f.move(e.clientX / innerWidth, 1 - e.clientY / innerHeight)
    }
    const down = (e: PointerEvent) => {
      f.pressed = true
      f.burst(e.clientX / innerWidth, 1 - e.clientY / innerHeight)
    }
    const up = () => (f.pressed = false)
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', down)
    addEventListener('pointerup', up)

    // If nobody touches it, a ghost hand stirs the name once in a while, so you know it's alive
    let ghostRaf = 0
    const ghost = setInterval(() => {
      if (reducedMotion || performance.now() - lastMove < 2500) return
      const r = nameBox.current!.getBoundingClientRect()
      if (!visible(r) || r.top < 0) return
      const t0 = performance.now()
      const run = () => {
        const k = Math.min(1, (performance.now() - t0) / 1400)
        const x = r.left + r.width * (0.1 + 0.8 * k)
        const y = r.top + r.height * (0.5 + 0.28 * Math.sin(k * Math.PI * 3))
        f.move(x / innerWidth, 1 - y / innerHeight)
        if (k < 1) ghostRaf = requestAnimationFrame(run)
      }
      run()
    }, 5200)

    const onResize = () => {
      sizeMask()
      metrics.clear()
      draw()
      f.resize()
    }
    addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(ghostRaf)
      clearInterval(ghost)
      removeEventListener('scroll', onScroll)
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', up)
      removeEventListener('resize', onResize)
      f.dispose()
    }
  }, [])

  return (
    <main className="is">
      <canvas ref={canvas} className="is__canvas" aria-hidden="true" />
      <section className="is__hero">
        <h1 className="sr-only">{site.fullName}</h1>
        <div ref={nameBox} className="is__name" aria-hidden="true" />
      </section>

      <section className="is__pitch">
        <p className="is__lines">
          <span>I design products,</span>
          <span>build them myself,</span>
          <span>and know their worth.</span>
        </p>
      </section>

      <section className="is__worth">
        <p className="is__caption">Computer engineering and finance. Every product I build has a number behind it.</p>
        <div ref={lineBox} className="is__line" aria-hidden="true" />
      </section>

      <section className="is__end">
        <div ref={helloBox} className="is__hello" aria-label="Say hello" />
        <a className="is__mail" href={`mailto:${site.email}`}>{site.email}</a>
        <a className="is__back" {...linkProps('/')}>Back to the site</a>
      </section>
    </main>
  )
}
