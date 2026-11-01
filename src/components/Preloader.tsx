import { useEffect, useRef } from 'react'
import { gsap, reduced } from '../lib/motion'
import { site } from '../content'
import { placeWord } from '../hero/wordmark'

// The loading screen (under a second) makes the name the way it gets made: 01 Design plots it
// as a fine halftone of ink dots, 02 Build swells the dots until they merge
// into solid ink, and 03 Ship hands that solid word to the live ink, which
// starts with its letters filled in exactly the same ink, in exactly the same
// place, and then begins to flow. It is drawn on a canvas with the same layout
// as the ink's letter shape, so the hand-over has no seam. It runs once per visit.

const STEPS = ['Design', 'Build', 'Ship']
const INK = '#212529'

// Read once per page load, outside React, so effects that run twice in
// development don't mark the visit as seen before the loader has played
const SEEN = (() => {
  try {
    const v = sessionStorage.getItem('pre-seen') === '1'
    sessionStorage.setItem('pre-seen', '1')
    return v
  } catch {
    return false
  }
})()

// Warmed after the loader, in the size this screen will actually use
const WARM = () =>
  innerWidth < 760
    ? ['/media/cube-phone-400.webp', '/media/nextup-poster-400.webp', '/media/folio-today-400.webp', '/media/tv-home-800.webp', '/media/by-1-400.webp']
    : ['/media/cube-poster-800.webp', '/media/nextup-card-800.webp', '/media/folio-room-400.webp', '/media/tv-home-800.webp', '/media/by-1-400.webp']

// Fetched and decoded while the loader plays, so the first scroll to the work
// deck never waits on an image (the loader's time is spent getting ready)
function loadImage(src: string) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  img.decode?.().catch(() => {})
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const step = useRef<HTMLSpanElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const count = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current!
    if (reduced() || SEEN) {
      el.style.display = 'none'
      onDone()
      return
    }

    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      // Tell the ink to start as this exact solid word, then let the page go
      ;(window as unknown as { __inkHandoff?: boolean }).__inkHandoff = true
      onDone()
    }
    WARM().forEach(loadImage)

    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.min(devicePixelRatio || 1, 2)
    // The dots: centres inside the letters, found once from the word's shape
    let dots: [number, number][] = []
    let cell = 0
    const state = { plot: 0, swell: 0 }

    const size = () => {
      c.width = Math.round(innerWidth * dpr)
      c.height = Math.round(innerHeight * dpr)
      // The halftone grid, read from the word drawn once off screen
      const b = box()
      cell = Math.max(3 * dpr, b.h / 15)
      // Only the word's own box is drawn and read, never the whole screen
      const off = document.createElement('canvas')
      off.width = Math.max(1, Math.ceil(b.w))
      off.height = Math.max(1, Math.ceil(b.h))
      const o = off.getContext('2d', { willReadFrequently: true })!
      placeWord(o, site.name, { x: 0, y: 0, w: b.w, h: b.h })
      o.fillStyle = '#000'
      o.fillText(site.name, 0, 0)
      const data = o.getImageData(0, 0, off.width, off.height).data
      dots = []
      for (let y = cell / 2; y < b.h; y += cell)
        for (let x = cell / 2; x < b.w; x += cell) {
          const i = (Math.min(off.height - 1, Math.round(y)) * off.width + Math.min(off.width - 1, Math.round(x))) * 4 + 3
          if (data[i]! > 40) dots.push([b.x + x, b.y + y])
        }
      draw()
    }

    // The hero's wordmark box, in canvas pixels (the page is at the top while loading)
    const box = () => {
      const r = document.querySelector('.hero__mark')?.getBoundingClientRect()
      const b = r && r.width > 0 ? r : { left: innerWidth * 0.06, top: innerHeight * 0.4, width: innerWidth * 0.88, height: innerHeight * 0.18 }
      return { x: b.left * dpr, y: b.top * dpr, w: b.width * dpr, h: b.height * dpr }
    }

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      if (!dots.length) return
      const b = box()
      ctx.fillStyle = INK
      // Plotted left to right; each dot swells from a pinprick to past touching
      const reach = b.x + state.plot * (b.w + cell * 6)
      const r = cell * (0.12 + 0.62 * state.swell)
      ctx.beginPath()
      for (const [x, y] of dots) {
        if (x > reach) continue
        const fresh = Math.min(1, (reach - x) / (cell * 6))
        const rr = r * (0.35 + 0.65 * fresh)
        ctx.moveTo(x + rr, y)
        ctx.arc(x, y, rr, 0, Math.PI * 2)
      }
      ctx.fill()
      // Keep only what falls inside the letters: once the dots merge, the word is exact
      ctx.globalCompositeOperation = 'destination-in'
      placeWord(ctx, site.name, b)
      ctx.fillText(site.name, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
      // At the end of Build the word is solid ink
      if (state.swell >= 1) {
        placeWord(ctx, site.name, b)
        ctx.fillText(site.name, 0, 0)
        ctx.setTransform(1, 0, 0, 1, 0, 0)
      }
    }

    const setStep = (i: number) => {
      gsap.timeline()
        .to(step.current, { yPercent: -100, autoAlpha: 0, duration: 0.1, ease: 'power2.in' })
        .add(() => {
          step.current!.textContent = STEPS[i]!
          num.current!.textContent = `0${i + 1}`
        })
        .fromTo(step.current, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.18, ease: 'power3.out' })
    }

    const progress = { v: 0 }
    const showCount = () => {
      count.current!.textContent = String(Math.round(progress.v)).padStart(3, '0')
    }

    // Wait until the ink's letters are filled, then disappear in the same frame
    const handOver = () => {
      const until = performance.now() + 900
      const w = window as unknown as { __inkFlooded?: boolean }
      const wait = () => {
        if (!w.__inkFlooded && performance.now() < until) return requestAnimationFrame(wait)
        // Two frames: the ink has drawn its filled letters before this word goes
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            // Same frame: the drawn word and the loader's paper go together, and
            // the ink beneath already shows the identical word on identical paper
            ctx.clearRect(0, 0, c.width, c.height)
            el.style.background = 'transparent'
            el.style.pointerEvents = 'none'
            gsap.to('.pre__meta', { autoAlpha: 0, duration: 0.3, delay: 0.25, onComplete: () => void (el.style.display = 'none') })
          }),
        )
      }
      wait()
    }

    let tl: gsap.core.Timeline | null = null
    document.fonts.load('800 100px Panchang').then(() => {
      size()
      tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, onUpdate: draw })
      tl.set(c, { autoAlpha: 1 })
        // 01 Design: a fine grid of ink dots is plotted across the letters
        .to(state, { plot: 1, duration: 0.45, ease: 'power1.inOut' })
        .to(progress, { v: 45, duration: 0.45, onUpdate: showCount }, '<')
        // 02 Build: the dots swell until they merge into solid ink
        .add(() => setStep(1))
        .to(state, { swell: 1, duration: 0.35, ease: 'power2.in' })
        .to(progress, { v: 90, duration: 0.35, onUpdate: showCount }, '<')
        // 03 Ship: the solid word becomes the live ink
        .add(() => setStep(2))
        .to(progress, { v: 100, duration: 0.15, onUpdate: showCount })
        .add(() => {
          finish()
          handOver()
        })
    })

    // Never hold a visitor behind the curtain
    const bail = setTimeout(() => {
      if (finished) return
      tl?.kill()
      gsap.to(el, { autoAlpha: 0, duration: 0.4, onComplete: () => void (el.style.display = 'none') })
      finish()
    }, 7000)
    addEventListener('resize', size)
    return () => {
      tl?.kill()
      clearTimeout(bail)
      removeEventListener('resize', size)
    }
  }, [onDone])

  return (
    <div ref={root} className="pre" aria-hidden="true">
      <canvas ref={canvas} className="pre__canvas" />
      <div className="pre__meta">
        <span className="pre__step"><span ref={num} className="pre__num">01</span><span className="pre__mask"><span ref={step}>{STEPS[0]}</span></span></span>
        <span ref={count} className="pre__count">000</span>
      </div>
    </div>
  )
}
