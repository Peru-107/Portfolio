import { useEffect, useRef, useState } from 'react'
import { InkP } from '../hero/InkP'
import { Typewriter } from '../hero/Typewriter'
import { site } from '../content'
import { gsap, scrollToId } from '../lib/motion'

// One screen that changes in place. First only my name in live ink; as you
// scroll, the screen holds still while the name glides up and settles near
// the top, and what I do slides in beneath it. Then the page moves on.
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLDivElement>(null)
  // A one-line hint, shown only if nobody has found the trick after a few seconds
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    const touch = matchMedia('(hover: none)').matches
    let found = false
    const onPlay = () => {
      found = true
      setHint(null)
    }
    window.addEventListener('ink:played', onPlay)
    // Gone as soon as the page moves on
    const onScroll = () => scrollY > 40 && setHint(null)
    window.addEventListener('scroll', onScroll, { passive: true })
    const t = window.setTimeout(() => {
      if (!found && scrollY < 40) setHint(touch ? 'Tilt your phone.' : 'Type something. It stays.')
    }, 4500)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('ink:played', onPlay)
      window.removeEventListener('scroll', onScroll)
    }
  }, [ready])

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Where the name ends up: at 60% size, its top edge clear of the header
      const scale = 0.6
      const lift = () => {
        const top = mark.current!.offsetTop
        // Clear of the header on every screen, short landscape phones included
        const header = document.querySelector('.header')?.getBoundingClientRect().bottom ?? 80
        return Math.max(innerHeight * 0.13, header + 12) - top * scale
      }
      // Linear against the scroll: an eased glide starts and ends slowly, which reads as the page stopping
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=200%', pin: true, scrub: true, invalidateOnRefresh: true },
      })
      tl.to(stage.current, { y: () => lift(), scale, duration: 1 })
        .to('.tw', { autoAlpha: 0, y: -40, duration: 0.3 }, 0)
        .from('.pitch__line > span', { yPercent: 110, duration: 0.6, stagger: 0.12, ease: 'power3.out' }, 0.35)
        .from('.pitch__meta > *', { autoAlpha: 0, y: 24, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 0.75)
        .to({}, { duration: 0.1 }) // a brief settle before the page moves on
    })
    return () => mm.revert()
  }, [])

  const lines = ['I design products,', 'build them myself,', 'and know their worth.']

  return (
    <section ref={root} id="top" className="hero">
      {/* The ink fills the whole screen and never moves; only the word's shape inside it does */}
      <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} track />
      <div ref={stage} className="hero__stage">
        <div ref={mark} className="hero__mark" aria-hidden="true" />
      </div>
      <h1 className="sr-only">{site.fullName}</h1>
      <Typewriter onWrite={() => setHint(null)} />
      <p className="hero__hint" data-on={hint ? '' : undefined} aria-hidden="true">{hint}</p>
      <div className="hero__pitch">
        <div className="pitch__copy">
          <p className="pitch__title" aria-label={site.pitch}>
            {lines.map((l) => (
              <span key={l} className="pitch__line" aria-hidden="true"><span>{l}</span></span>
            ))}
          </p>
        </div>
        <div className="pitch__meta">
          <p className="pitch__status"><i aria-hidden="true" />{site.status}</p>
          <a href="#work" className="pitch__link" onClick={(e) => (e.preventDefault(), scrollToId('work'))}>See what I’ve built</a>
        </div>
      </div>
    </section>
  )
}
