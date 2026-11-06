import { useEffect, useRef } from 'react'
import { gsap, reduced } from '../lib/motion'
import { site } from '../content'
import { placeWord } from '../hero/wordmark'

// The loading screen (about two seconds, once per visit): a sheet of ink with the
// name set in paper, exactly where the live ink will draw it. The name comes
// out of a blur, a counter runs to 100 and a thin magma line fills along the
// bottom. Then the sheet folds down into that line, and as it goes the live
// ink underneath is already showing the name in the same place, ready to flow.

const PAPER = '#e9ecef'
const EASE = 'cubic-bezier(0.77, 0.02, 0.24, 1.02)'

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

// Warmed while the loader plays, in the size this screen will actually use
const WARM = () =>
  innerWidth < 760
    ? ['/media/cube-phone-400.webp', '/media/nextup-poster-400.webp', '/media/folio-today-400.webp', '/media/tv-home-800.webp', '/media/by-1-400.webp']
    : ['/media/cube-poster-800.webp', '/media/nextup-card-800.webp', '/media/folio-room-400.webp', '/media/tv-home-800.webp', '/media/by-1-400.webp']

// Fetched and decoded during the loader, so the first scroll to the work
// deck never waits on an image
function loadImage(src: string) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  img.decode?.().catch(() => {})
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const count = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)

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
      // Tell the ink to start as the solid word, in the same place
      ;(window as unknown as { __inkHandoff?: boolean }).__inkHandoff = true
      onDone()
    }
    WARM().forEach(loadImage)

    const c = canvas.current!
    const ctx = c.getContext('2d')!
    const dpr = Math.min(devicePixelRatio || 1, 2)

    // The hero's wordmark box (the page is at the top while loading)
    const box = () => {
      const r = document.querySelector('.hero__mark')?.getBoundingClientRect()
      // A reload that keeps its scroll position has the hero off screen: centre the name instead
      const b = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight ? r : { left: innerWidth * 0.06, top: innerHeight * 0.4, width: innerWidth * 0.88, height: innerHeight * 0.18 }
      return { x: b.left * dpr, y: b.top * dpr, w: b.width * dpr, h: b.height * dpr }
    }
    const draw = () => {
      c.width = Math.round(innerWidth * dpr)
      c.height = Math.round(innerHeight * dpr)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      placeWord(ctx, site.name, box())
      ctx.fillStyle = PAPER
      ctx.fillText(site.name, 0, 0)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }

    const progress = { v: 0 }
    const showCount = () => {
      count.current!.textContent = String(Math.round(progress.v)).padStart(3, '0')
    }

    // Wait until the ink's letters are filled, then fold the sheet away
    const fold = () => {
      const until = performance.now() + 900
      const w = window as unknown as { __inkFlooded?: boolean }
      const wait = () => {
        if (!w.__inkFlooded && performance.now() < until) return requestAnimationFrame(wait)
        el.style.pointerEvents = 'none'
        gsap.timeline({ onComplete: () => void (el.style.display = 'none') })
          // The sheet closes down into the magma line along its bottom edge
          .to(el, { clipPath: 'inset(calc(100% - 2px) 0% 0% 0%)', duration: 0.6, ease: EASE })
          .to('.pre__meta', { autoAlpha: 0, duration: 0.2 }, 0)
          // and the line runs off to the right
          .to(line.current, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.35, ease: 'power3.in' }, '-=0.05')
      }
      wait()
    }

    let tl: gsap.core.Timeline | null = null
    document.fonts.load('800 100px Panchang').then(() => {
      draw()
      tl = gsap.timeline()
      // The name comes out of a blur, settling up into place
      tl.fromTo(c, { autoAlpha: 0, filter: 'blur(10px)', y: 10 }, { autoAlpha: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: EASE })
        .to(progress, { v: 100, duration: 1.1, ease: 'power2.inOut', onUpdate: showCount }, 0.1)
        .fromTo(line.current, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%', duration: 1.1, ease: 'power2.inOut' }, 0.1)
        .add(() => {
          finish()
          fold()
        })
    })

    // Never hold a visitor behind the curtain
    const bail = setTimeout(() => {
      if (finished) return
      tl?.kill()
      gsap.to(el, { autoAlpha: 0, duration: 0.4, onComplete: () => void (el.style.display = 'none') })
      finish()
    }, 7000)
    addEventListener('resize', draw)
    return () => {
      tl?.kill()
      clearTimeout(bail)
      removeEventListener('resize', draw)
    }
  }, [onDone])

  return (
    <div ref={root} className="pre" aria-hidden="true">
      <canvas ref={canvas} className="pre__canvas" />
      <div className="pre__meta">
        <span className="pre__label">{site.fullName}, portfolio</span>
        <span ref={count} className="pre__count">000</span>
      </div>
      <span ref={line} className="pre__line" />
    </div>
  )
}
