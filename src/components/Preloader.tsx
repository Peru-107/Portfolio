import { useEffect, useRef } from 'react'
import { gsap, reduced } from '../lib/motion'
import { site } from '../content'

// The loading screen tells the headline in under two seconds: the name is
// drawn as an outline (design), filled in (build), then inked in magma
// (worth). It sits exactly where the hero's ink wordmark will appear, so the
// fade into the page has no jump. It runs once per visit, and waits only as
// long as the fonts and the first images actually take.

const STEPS = ['Design', 'Build', 'Ship']

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
const PRELOAD = ['/media/cube-poster.webp', '/media/nextup-card.webp', '/media/folio-room.webp', '/media/tv-home.webp', '/media/by-1.webp']

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLDivElement>(null)
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
      onDone()
    }

    // Place the word over the hero's wordmark box, sized to fill it
    const place = () => {
      const w = word.current!
      const mark = document.querySelector('.hero__mark')?.getBoundingClientRect()
      const box = mark && mark.width > 0 ? mark : { left: innerWidth * 0.08, top: innerHeight * 0.38, width: innerWidth * 0.84, height: innerHeight * 0.24 }
      const ctx = document.createElement('canvas').getContext('2d')!
      ctx.font = '800 100px Panchang'
      const m = ctx.measureText(site.name)
      const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
      const size = Math.min(box.height / (glyphH / 100), box.width / (m.width / 100))
      // With line-height 1 the capitals sit close to the middle of the line box
      Object.assign(w.style, { left: `${box.left}px`, top: `${box.top + box.height / 2 - size / 2}px`, width: `${box.width}px`, fontSize: `${size}px` })
    }

    const setStep = (i: number) => {
      gsap.timeline()
        .to(step.current, { yPercent: -100, autoAlpha: 0, duration: 0.18, ease: 'power2.in' })
        .add(() => {
          step.current!.textContent = STEPS[i]!
          num.current!.textContent = `0${i + 1}`
        })
        .fromTo(step.current, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' })
    }

    const loaded = Promise.all([document.fonts.load('800 100px Panchang').then(() => document.fonts.ready), ...PRELOAD.map(loadImage)])
    const progress = { v: 0 }
    const showCount = () => {
      count.current!.textContent = String(Math.round(progress.v)).padStart(3, '0')
    }

    let tl: gsap.core.Timeline | null = null
    document.fonts.load('800 100px Panchang').then(() => {
      place()
      tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } })
      tl.set(word.current, { autoAlpha: 1 })
        // 01 Design: the outline is drawn left to right
        .fromTo('.pre__outline', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7 })
        .to(progress, { v: 40, duration: 0.7, onUpdate: showCount }, '<')
        // 02 Build: it fills in solid, bottom to top
        .add(() => setStep(1))
        .fromTo('.pre__solid', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.55 })
        .to(progress, { v: 75, duration: 0.55, onUpdate: showCount }, '<')
        // 03 Ship: magma ink sweeps across, once everything has loaded
        .addPause('+=0', () => {
          loaded.then(() => tl?.resume())
        })
        .add(() => setStep(2))
        .fromTo('.pre__ink', { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' })
        .to(progress, { v: 100, duration: 0.6, onUpdate: showCount }, '<')
        // Hand over: the page's live ink starts as this fades away
        .add(finish, '+=0.1')
        .to('.pre__meta', { autoAlpha: 0, duration: 0.3 }, '<')
        // The word softens with a Gaussian blur and dissolves into the live ink beneath
        .to('.pre__word', { filter: 'blur(26px)', autoAlpha: 0, scale: 1.03, duration: 1.1, ease: 'power2.inOut' }, '<')
        .to(el, { backgroundColor: 'rgba(233, 236, 239, 0)', duration: 1.1, ease: 'power2.inOut' }, '<')
        .set(el, { display: 'none' })
    })

    // Never hold a visitor behind the curtain
    const bail = setTimeout(() => {
      if (finished) return
      tl?.kill()
      gsap.to(el, { autoAlpha: 0, duration: 0.4, onComplete: () => { el.style.display = 'none' } })
      finish()
    }, 7000)
    addEventListener('resize', place)
    return () => {
      tl?.kill()
      clearTimeout(bail)
      removeEventListener('resize', place)
    }
  }, [onDone])

  return (
    <div ref={root} className="pre" aria-hidden="true">
      <div ref={word} className="pre__word">
        <span className="pre__outline">{site.name}</span>
        <span className="pre__solid">{site.name}</span>
        <span className="pre__ink">{site.name}</span>
      </div>
      <div className="pre__meta">
        <span className="pre__step"><span ref={num} className="pre__num">01</span><span className="pre__mask"><span ref={step}>{STEPS[0]}</span></span></span>
        <span ref={count} className="pre__count">000</span>
      </div>
    </div>
  )
}
