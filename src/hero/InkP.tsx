import { useEffect, useRef, type RefObject } from 'react'
import { InkField } from './fluid'

// The hero mark: a capital P that holds live ink. The mask is drawn from the
// display face itself, so the letter is the site's own type, not a model.

const PAPER: [number, number, number] = [0.914, 0.925, 0.937]
// Each ink is what it absorbs from paper: charcoal, magma, ember, deep red
const INKS: [number, number, number][] = [
  [0.74, 0.73, 0.72],
  [0.0, 0.52, 0.86],
  [0.0, 0.22, 0.7],
  [0.72, 0.72, 0.71],
  [0.2, 0.82, 0.82],
  [0.0, 0.48, 0.84],
]

type Layout = 'hero' | 'center' | 'wordmark'
type Box = { x: number; y: number; w: number; h: number }
/** A typed letter printed in ink: position and size in CSS pixels, a = how solid it still is */
type Glyph = { ch: string; x: number; y: number; size: number; born: number; a: number }

function drawMask(c: HTMLCanvasElement, w: number, h: number, text: string, layout: Layout, box?: Box | null, extras: Glyph[] = []) {
  // A word has small counters (the slit in the e): draw it sharp and full size
  // drawn at the screen's real pixel density (up to 2x) so edges stay crisp on high-DPI displays
  const scale = layout === 'wordmark' ? Math.min(window.devicePixelRatio || 1, 2) : 0.5
  // Resizing a canvas reallocates it; only do that when the size really changed
  const cw = Math.max(2, Math.round(w * scale))
  const ch = Math.max(2, Math.round(h * scale))
  if (c.width !== cw) c.width = cw
  if (c.height !== ch) c.height = ch
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, c.width, c.height)
  const narrow = w < 760 || layout === 'center'
  const word = layout === 'wordmark'
  // Fit the glyph to a box: most of the height on wide screens, but never so
  // wide that it runs under the headline on the left
  ctx.font = `800 100px Panchang, "Arial Black", sans-serif`
  const probe = ctx.measureText(text)
  const ratio = probe.width / (probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent)
  const boxW = word ? c.width * 0.94 : layout === 'center' ? c.width * 0.86 : narrow ? c.width * 0.86 : c.width * 0.5
  const boxH = word ? c.height * (w < 760 ? 0.2 : 0.4) : layout === 'center' ? c.height * 0.62 : narrow ? c.height * 0.5 : c.height * 0.84
  // With an anchor box from the page layout, the word fills exactly that box
  const bw = box ? box.w * scale : boxW
  const bh = box ? box.h * scale : boxH
  const glyph = Math.min(bh, bw / ratio)
  const size = glyph * (100 / (probe.actualBoundingBoxAscent + probe.actualBoundingBoxDescent))
  ctx.font = `800 ${size}px Panchang, "Arial Black", sans-serif`
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(text)
  const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
  const x = box ? box.x * scale - m.actualBoundingBoxLeft : word || narrow ? (c.width - m.width) / 2 : c.width * 0.95 - m.width
  const y = box ? box.y * scale + (bh - glyphH) / 2 + m.actualBoundingBoxAscent : word ? c.height * (w < 760 ? 0.13 : 0.12) + m.actualBoundingBoxAscent : layout === 'center' ? (c.height - glyphH) / 2 + m.actualBoundingBoxAscent : narrow ? c.height * 0.1 + m.actualBoundingBoxAscent : (c.height - glyphH) * 0.42 + m.actualBoundingBoxAscent
  ctx.fillStyle = '#fff'
  ctx.filter = layout === 'wordmark' ? `blur(${0.5 * scale}px)` : 'blur(2px)'
  ctx.fillText(text, x, y)
  for (const g of extras) {
    ctx.font = `800 ${g.size * scale}px Panchang, "Arial Black", sans-serif`
    ctx.fillStyle = `rgba(255,255,255,${g.a})`
    ctx.fillText(g.ch, g.x * scale, g.y * scale)
  }
  ctx.filter = 'none'
}

export function InkP({ play, onStir, text = 'P', layout = 'hero', anchor, track }: { play: boolean; onStir?: () => void; text?: string; layout?: Layout; anchor?: RefObject<HTMLElement | null>; track?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const field = useRef<InkField | null>(null)
  const fallback = useRef<HTMLDivElement>(null)
  // Set once the page asks the ink to play; the visibility check reads it
  const wanted = useRef(false)

  useEffect(() => {
    const c = canvas.current!
    const mask = document.createElement('canvas')
    // Where the page wants the word, relative to the canvas
    const box = (): Box | null => {
      const a = anchor?.current
      if (!a) return null
      const r = a.getBoundingClientRect()
      const cr = c.getBoundingClientRect()
      return { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height }
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    let f: InkField
    try {
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, box())
      f = new InkField({ canvas: c, mask, paper: PAPER, inks: INKS, reducedMotion: reduced })
    } catch {
      fallback.current?.setAttribute('data-on', '')
      return
    }
    field.current = f
    document.fonts.load('800 100px Panchang').then(() => {
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, box())
      f.refreshMask()
    })

    // Rebuilding the simulation wipes the ink, so only do it when the screen
    // size really changed; pinning and layout nudges just redraw the shape
    let size = [c.clientWidth, c.clientHeight]
    const ro = new ResizeObserver(() => {
      const w = c.clientWidth
      const h = c.clientHeight
      drawMask(mask, w, h, text, layout, box())
      if (Math.abs(w - size[0]!) > 2 || Math.abs(h - size[1]!) > 140) {
        size = [w, h]
        f.resize()
      } else {
        f.maskChanged()
      }
    })
    ro.observe(c)
    if (anchor?.current) ro.observe(anchor.current)

    // Only simulate while the hero is on screen
    const io = new IntersectionObserver(([e]) => (e!.isIntersecting && wanted.current ? f.start() : f.stop()), { threshold: 0, rootMargin: '25% 0px 25% 0px' })
    io.observe(c)

    let stirred = false
    const local = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height] as const
    }
    const move = (e: PointerEvent) => {
      const [x, y] = local(e)
      if (x < 0 || x > 1 || y < 0 || y > 1) return
      f.move(x, y)
      if (!stirred) {
        stirred = true
        onStir?.()
      }
    }
    // Click blooms a drop; press and drag pulls the ink like taffy
    const down = (e: PointerEvent) => {
      const [x, y] = local(e)
      if (y < 0 || y > 1) return
      f.pressed = true
      f.burst(x, y)
    }
    const up = () => (f.pressed = false)
    // Type, and the letter is printed in ink somewhere on the paper; it holds
    // for a moment, then dissolves into smoke. Other keys splash the name.
    const glyphs: Glyph[] = []
    let played = false
    const firstPlay = () => {
      if (played) return
      played = true
      window.dispatchEvent(new Event('ink:played'))
    }
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest('input, textarea, [contenteditable]')) return
      const r = c.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) return
      firstPlay()
      if (e.key.length !== 1 || e.key === ' ') {
        f.splash()
        return
      }
      const W = c.clientWidth
      const H = c.clientHeight
      const size = Math.max(80, Math.min(260, Math.min(W, H) * 0.24))
      const b = box()
      // Keep clear of the name: above it or below it, whichever has room
      const above = b ? b.y : H * 0.4
      const below = b ? H - (b.y + b.h) : H * 0.4
      const useAbove = above > below ? Math.random() < 0.7 : Math.random() < 0.3
      // Inside the clear middle of the screen: below the header, above the faded bottom edge
      const yMin = useAbove ? Math.max(120, H * 0.1) + size * 0.8 : (b ? b.y + b.h : H * 0.6) + size * 0.85
      const yMax = useAbove ? (b ? b.y : H * 0.4) - size * 0.1 : H * 0.8
      const y = yMin + Math.random() * Math.max(0, yMax - yMin)
      const x = W * 0.06 + Math.random() * (W * 0.88 - size * 0.9)
      glyphs.push({ ch: e.key, x, y, size, born: performance.now(), a: 0 })
      if (glyphs.length > 8) glyphs.shift()
      // Pour ink into it from a few points so it fills at once
      for (let i = 0; i < 6; i++) {
        const px = x + Math.random() * size * 0.85
        const py = y - Math.random() * size * 0.7
        const a = Math.random() * Math.PI * 2
        f.feed(px / W, 1 - py / H, Math.cos(a) * 160, Math.sin(a) * 160, 1.1, 0.0035)
      }
    }

    // On phones: tilt and the ink sloshes the way gravity pulls it
    const tilt = (e: DeviceOrientationEvent) => {
      const gx = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 40))
      const gy = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 40))
      tiltForce = [gx, gy]
    }
    let tiltForce: [number, number] = [0, 0]
    const tiltTimer = window.setInterval(() => {
      const [gx, gy] = tiltForce
      if (Math.abs(gx) + Math.abs(gy) < 0.2) return
      firstPlay()
      for (let i = 0; i < 3; i++) f.feed(0.1 + Math.random() * 0.8, 0.3 + Math.random() * 0.5, gx * 320, -gy * 320, 0.25, 0.004)
    }, 140)
    const askTilt = () => {
      const D = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
      if (typeof D.requestPermission === 'function') D.requestPermission().then((p) => p === 'granted' && window.addEventListener('deviceorientation', tilt)).catch(() => {})
    }
    if (matchMedia('(hover: none)').matches) {
      window.addEventListener('deviceorientation', tilt)
      c.addEventListener('pointerdown', askTilt, { once: true })
    }
    // Left alone, a ghost hand stirs the word now and then so it never looks still
    let lastTouch = performance.now()
    let ghostRaf = 0
    const ghost = window.setInterval(() => {
      if (performance.now() - lastTouch < 3500 || reduced) return
      const r = c.getBoundingClientRect()
      if (r.bottom < innerHeight * 0.3 || r.top > innerHeight) return
      const a = anchor?.current?.getBoundingClientRect() ?? r
      const t0 = performance.now()
      const run = () => {
        const k = Math.min(1, (performance.now() - t0) / 1600)
        const px = a.left + a.width * (0.08 + 0.84 * k)
        const py = a.top + a.height * (0.5 + 0.3 * Math.sin(k * Math.PI * 3))
        f.move((px - r.left) / r.width, 1 - (py - r.top) / r.height)
        if (k < 1) ghostRaf = requestAnimationFrame(run)
      }
      run()
    }, 5000)
    const touched = () => (lastTouch = performance.now())

    // When the word is moved by the page (scroll animations), redraw its shape
    // where it now is, and carry the ink along with it
    let trackRaf = 0
    let lastBox = box()
    const follow = () => {
      trackRaf = requestAnimationFrame(follow)
      const b = box()
      // Typed letters fade in fast, hold, then thin away into the smoke
      if (glyphs.length) {
        const now = performance.now()
        for (const g of glyphs) {
          const t = (now - g.born) / 1000
          g.a = t < 0.2 ? t / 0.2 : t < 1.6 ? 1 : Math.max(0, 1 - (t - 1.6) / 0.9)
        }
        while (glyphs.length && glyphs[0]!.a === 0 && now - glyphs[0]!.born > 1000) glyphs.shift()
        drawMask(mask, c.clientWidth, c.clientHeight, text, layout, b, glyphs)
        f.maskChanged()
        if (!glyphs.length) drawMask(mask, c.clientWidth, c.clientHeight, text, layout, b)
      }
      if (!b || !lastBox) return
      if (Math.abs(b.y - lastBox.y) + Math.abs(b.h - lastBox.h) < 0.5) return
      const dy = lastBox.y + lastBox.h / 2 - (b.y + b.h / 2)
      lastBox = b
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, b, glyphs)
      f.maskChanged()
      f.scroll(dy)
    }
    if (track) trackRaf = requestAnimationFrame(follow)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointermove', touched, { passive: true })
    c.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('keydown', key)
    return () => {
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointermove', touched)
      c.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('keydown', key)
      window.clearInterval(ghost)
      window.clearInterval(tiltTimer)
      window.removeEventListener('deviceorientation', tilt)
      cancelAnimationFrame(ghostRaf)
      cancelAnimationFrame(trackRaf)
      f.dispose()
      field.current = null
    }
  }, [onStir, text, layout, anchor])

  useEffect(() => {
    const f = field.current
    if (!play || !f) return
    wanted.current = true
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      f.start()
      return
    }
    f.start()
    f.pour()
    // The letter fades up as the first ink lands in it
    const t0 = performance.now()
    let raf = 0
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / 1400)
      f.reveal = 1 - Math.pow(1 - k, 3)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [play])

  return (
    <>
      <canvas ref={canvas} className="ink-canvas" aria-hidden="true" />
      <div ref={fallback} className="ink-fallback" aria-hidden="true">P</div>
    </>
  )
}
