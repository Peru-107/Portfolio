import { useEffect, useRef } from 'react'
import { gsap, reduced } from '../lib/motion'
import { site } from '../content'

// The name fills with ink from the bottom as the page loads, while status
// lines from my own projects roll past. It waits for the fonts and the hero
// images, then lifts away like a sheet of paper.

const LINES = [
  'Mixing the ink',
  'Waking up Sproutling',
  'Tuning the TV remote',
  'Scanning your timetable',
  'Reading the markets',
  'Asking the GPU nicely',
  'Almost there',
]

const PRELOAD = ['/media/cube-poster.webp', '/media/folio-card.webp', '/media/tv-home.webp', '/media/nextup-card.webp', '/media/by-1.webp']

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const num = useRef<HTMLSpanElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  const line = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current!
    // A recruiter gives the homepage about ten seconds: the full show runs once
    // per visit, and only for as long as loading actually takes
    let seen = false
    try {
      seen = sessionStorage.getItem('pre-seen') === '1'
      sessionStorage.setItem('pre-seen', '1')
    } catch {}
    if (reduced() || seen) {
      el.style.display = 'none'
      onDone()
      return
    }
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      onDone()
    }

    // Real progress: fonts and the hero's images. The counter eases toward it
    // and never runs ahead of what has actually loaded.
    const jobs = [document.fonts.ready.then(() => undefined), ...PRELOAD.map(loadImage)]
    let done = 0
    const target = { v: 0 }
    jobs.forEach((j) => j.then(() => (target.v = (++done / jobs.length) * 100)))

    const shown = { v: 0 }
    let li = 0
    let lastLine = 0
    const tick = () => {
      // About three-quarters of a second for the whole fill on a fast line
      shown.v = Math.min(target.v, shown.v + 2.4)
      num.current!.textContent = String(Math.round(shown.v)).padStart(3, '0')
      fill.current!.style.clipPath = `inset(${100 - shown.v}% 0 0 0)`
      const step = Math.min(LINES.length - 1, Math.floor((shown.v / 100) * LINES.length))
      if (step !== li && performance.now() - lastLine > 160) {
        li = step
        lastLine = performance.now()
        const l = line.current!
        gsap.timeline()
          .to(l, { yPercent: -100, autoAlpha: 0, duration: 0.2, ease: 'power2.in' })
          .add(() => { l.textContent = LINES[li]! })
          .fromTo(l, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' })
      }
      if (shown.v >= 100) {
        gsap.ticker.remove(tick)
        exit()
      }
    }

    const exit = () => {
      gsap
        .timeline({ onComplete: () => { el.style.display = 'none' } })
        .to('.pre__drop', { scale: 18, duration: 0.5, ease: 'power3.in' })
        .to('.pre__meta', { autoAlpha: 0, duration: 0.25 }, '<')
        .to(el, { yPercent: -100, duration: 0.75, ease: 'expo.inOut' }, '-=0.2')
        .add(finish, '-=0.55')
    }

    gsap.from('.pre__word', { yPercent: 40, autoAlpha: 0, duration: 0.9, ease: 'power4.out' })
    gsap.ticker.add(tick)

    // Never hold a visitor behind the curtain: if anything stalls, open anyway
    const bail = setTimeout(() => {
      target.v = 100
    }, 6000)
    const hard = setTimeout(() => {
      if (getComputedStyle(el).display !== 'none') {
        el.style.display = 'none'
        finish()
      }
    }, 9000)
    return () => {
      gsap.ticker.remove(tick)
      clearTimeout(bail)
      clearTimeout(hard)
    }
  }, [onDone])

  return (
    <div ref={root} className="pre" aria-hidden="true">
      <div className="pre__word">
        <span className="pre__ghost">{site.name}</span>
        <span ref={fill} className="pre__fill">{site.name}</span>
      </div>
      <div className="pre__meta">
        <span className="pre__status"><span ref={line}>{LINES[0]}</span>…</span>
        <span className="pre__count"><span ref={num}>000</span></span>
      </div>
      <span className="pre__drop" />
    </div>
  )
}
