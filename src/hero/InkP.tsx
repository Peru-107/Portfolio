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

function drawMask(c: HTMLCanvasElement, w: number, h: number, text: string, layout: Layout, box?: Box | null) {
  // A word has small counters (the slit in the e): draw it sharp and full size
  const scale = layout === 'wordmark' ? 1 : 0.5
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
  ctx.filter = layout === 'wordmark' ? 'blur(0.6px)' : 'blur(2px)'
  ctx.fillText(text, x, y)
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

    const ro = new ResizeObserver(() => {
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, box())
      f.resize()
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
    // Any key splashes ink into a random letter
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest('input, textarea, [contenteditable]')) return
      const r = c.getBoundingClientRect()
      if (r.bottom < 0 || r.top > innerHeight) return
      f.splash()
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
      if (!b || !lastBox) return
      if (Math.abs(b.y - lastBox.y) + Math.abs(b.h - lastBox.h) < 0.5) return
      const dy = lastBox.y + lastBox.h / 2 - (b.y + b.h / 2)
      lastBox = b
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, b)
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
