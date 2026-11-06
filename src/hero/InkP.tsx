import { useEffect, useRef, type RefObject } from 'react'
import { InkField } from './fluid'
import { placeWord } from './wordmark'
import { gsap } from '../lib/motion'

// The hero mark: a capital P that holds live ink. The mask is drawn from the
// display face itself, so the letter is the site's own type, not a model.

const PAPER: [number, number, number] = [0.914, 0.925, 0.937]
// Each ink is what it absorbs from paper: charcoal, magma, ember, deep red
const INKS: [number, number, number][] = [
  [0.74, 0.73, 0.72],
  [0.0, 0.66, 0.88],
  [0.0, 0.22, 0.7],
  [0.72, 0.72, 0.71],
  [0.2, 0.82, 0.82],
  [0.0, 0.6, 0.87],
]

type Layout = 'hero' | 'center' | 'wordmark'
type Box = { x: number; y: number; w: number; h: number }

function drawMask(c: HTMLCanvasElement, w: number, h: number, text: string, layout: Layout, box?: Box | null) {
  // A word has small counters (the slit in the e): draw it sharp and full size
  // drawn at the screen's real pixel density (up to 2x) so edges stay crisp on high-DPI displays
  const light = matchMedia('(hover: none), (max-width: 759px)').matches
  const scale = layout === 'wordmark' ? Math.min(window.devicePixelRatio || 1, light ? 1.5 : 2) : 0.5
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
  ctx.fillStyle = '#fff'
  ctx.filter = layout === 'wordmark' ? `blur(${0.5 * scale}px)` : 'blur(2px)'
  if (box) {
    // Set once and scaled (shared with the loading screen), never re-typeset
    placeWord(ctx, text, { x: box.x * scale, y: box.y * scale, w: bw, h: bh })
    ctx.fillText(text, 0, 0)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.filter = 'none'
    return
  }
  const x = word || narrow ? (c.width - m.width) / 2 : c.width * 0.95 - m.width
  const y = word ? c.height * (w < 760 ? 0.13 : 0.12) + m.actualBoundingBoxAscent : layout === 'center' ? (c.height - glyphH) / 2 + m.actualBoundingBoxAscent : narrow ? c.height * 0.1 + m.actualBoundingBoxAscent : (c.height - glyphH) * 0.42 + m.actualBoundingBoxAscent
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
    // The box the shape was last drawn into; movement from there is a transform
    let rest = box()
    const redraw = () => {
      rest = box()
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, rest)
      // New drawing, so the shaders read it as is: identity transform, fresh upload
      f?.setMaskTransform(1, 0, 0)
      f?.maskChanged()
    }
    let alive = true
    try {
      drawMask(mask, c.clientWidth, c.clientHeight, text, layout, rest)
      f = new InkField({ canvas: c, mask, paper: PAPER, inks: INKS, reducedMotion: reduced })
    } catch {
      fallback.current?.setAttribute('data-on', '')
      return
    }
    field.current = f
    // The hero's ink fades out on every side
    f.edges = layout === 'wordmark'
    // Redraw once the display face is in, and again if any font loads later:
    // a shape drawn in a fallback face must never stay on screen
    const fontsIn = () => {
      if (!alive) return
      redraw()
      f.refreshMask()
    }
    document.fonts.load('800 100px Panchang').then(fontsIn)
    document.fonts.addEventListener('loadingdone', fontsIn)

    // Rebuilding the simulation wipes the ink, so only do it when the screen
    // size really changed; pinning and layout nudges just redraw the shape
    let size = [c.clientWidth, c.clientHeight]
    const ro = new ResizeObserver(() => {
      const w = c.clientWidth
      const h = c.clientHeight
      redraw()
      if (Math.abs(w - size[0]!) > 2 || Math.abs(h - size[1]!) > 140) {
        size = [w, h]
        f.resize()
      } else {
        f.fit()
        f.maskChanged()
      }
    })
    ro.observe(c)
    if (anchor?.current) ro.observe(anchor.current)

    // Only simulate while the hero is on screen
    let onScreen = true
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e!.isIntersecting
        if (onScreen && wanted.current) f.start()
        else f.stop()
      },
      { threshold: 0, rootMargin: '25% 0px 25% 0px' },
    )
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
    let played = false
    const firstPlay = () => {
      if (played) return
      played = true
      window.dispatchEvent(new Event('ink:played'))
    }
    // The typewriter tells the ink where each key struck (viewport pixels):
    // a small splash for a new letter, a softer puff when one is lifted off
    const drop = (e: Event) => {
      const d = (e as CustomEvent<{ x: number; y: number; puff?: boolean }>).detail
      const r = c.getBoundingClientRect()
      const nx = (d.x - r.left) / r.width
      const ny = 1 - (d.y - r.top) / r.height
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return
      firstPlay()
      const n = d.puff ? 3 : 5
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2
        const v = d.puff ? 220 : 120
        f.feed(nx, ny, Math.cos(a) * v, Math.sin(a) * v + (d.puff ? 140 : 0), d.puff ? 0.25 : 0.55, d.puff ? 0.003 : 0.0016)
      }
    }
    window.addEventListener('ink:drop', drop)

    // On phones: tilt and the ink sloshes the way gravity pulls it
    const tilt = (e: DeviceOrientationEvent) => {
      const gx = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 40))
      const gy = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 40))
      tiltForce = [gx, gy]
    }
    let tiltForce: [number, number] = [0, 0]
    const tiltTimer = window.setInterval(() => {
      const [gx, gy] = tiltForce
      if (!onScreen || document.hidden || Math.abs(gx) + Math.abs(gy) < 0.2) return
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
        // Eased in and out over 2.6s, a slow S through the word: a stir, not a swipe
        const t = Math.min(1, (performance.now() - t0) / 2600)
        const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        const px = a.left + a.width * (0.1 + 0.8 * k)
        const py = a.top + a.height * (0.5 + 0.22 * Math.sin(k * Math.PI * 2))
        f.move((px - r.left) / r.width, 1 - (py - r.top) / r.height)
        if (t < 1) ghostRaf = requestAnimationFrame(run)
      }
      run()
    }, 5000)
    const touched = () => (lastTouch = performance.now())

    // When the word is moved by the page (scroll animations), redraw its shape
    // where it now is, and carry the ink along with it
    let lastBox = box()
    // The word moves with the scroll, and otherwise only during a resize or a
    // CSS transition on its anchor (the lift when someone writes); watch for those
    let lastY = -1
    let moveUntil = performance.now() + 2500
    const moving = () => (moveUntil = performance.now() + 1000)
    const anchorEl = anchor?.current
    anchorEl?.addEventListener('transitionrun', moving)
    addEventListener('resize', moving)
    const follow = () => {
      // Off screen, or nothing has moved: skip the layout read entirely
      if (!onScreen) return
      const y = scrollY
      if (y === lastY && performance.now() > moveUntil) return
      lastY = y
      const b = box()
      if (!b || !lastBox) return
      if (Math.abs(b.y - lastBox.y) + Math.abs(b.h - lastBox.h) < 0.5) return
      const dy = lastBox.y + lastBox.h / 2 - (b.y + b.h / 2)
      lastBox = b
      // The shape stays as drawn; the shaders are told where it is now
      if (rest && rest.h > 0) {
        const W = c.clientWidth || 1
        const H = c.clientHeight || 1
        const s = b.h / rest.h
        f.setMaskTransform(1 / s, rest.x / W - b.x / (s * W), 1 - rest.y / H - 1 / s + b.y / (s * H))
      }
      f.scroll(dy)
    }
    // On GSAP's clock, after the scroll animation has placed the word this frame
    if (track) gsap.ticker.add(follow)
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointermove', touched, { passive: true })
    c.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      alive = false
      document.fonts.removeEventListener('loadingdone', fontsIn)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointermove', touched)
      c.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('ink:drop', drop)
      window.clearInterval(ghost)
      window.clearInterval(tiltTimer)
      window.removeEventListener('deviceorientation', tilt)
      cancelAnimationFrame(ghostRaf)
      gsap.ticker.remove(follow)
      anchorEl?.removeEventListener('transitionrun', moving)
      removeEventListener('resize', moving)
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
    // After the loading screen: the ink starts as that same solid word, then
    // magma pours in and the letters begin to flow
    const w = window as unknown as { __inkHandoff?: boolean; __inkFlooded?: boolean }
    if (w.__inkHandoff) {
      w.__inkHandoff = false
      f.reveal = 1
      f.flood([0.129, 0.145, 0.161])
      w.__inkFlooded = true
      const t = window.setTimeout(() => f.pour(), 220)
      return () => window.clearTimeout(t)
    }
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
