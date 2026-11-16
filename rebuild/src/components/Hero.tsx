import { useEffect, useRef, useState } from 'react'
import { InkP } from '../hero/InkP'
import { Typewriter } from '../hero/Typewriter'
import { site } from '../content'
import { gsap, scrollToId } from '../lib/motion'
import { Roll } from './Roll'

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [invite, setInvite] = useState(false)

  useEffect(() => {
    if (!ready) return
    const touch = matchMedia('(hover: none)').matches
    let found = false
    const onPlay = () => {
      found = true
      setHint(null)
    }
    window.addEventListener('ink:played', onPlay)
    const onScroll = () => {
      if (scrollY <= 40) return
      setHint(null)
      setInvite(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const t = window.setTimeout(() => {
      if (scrollY >= 40) return
      if (touch) setInvite(true)
      else if (!found) setHint('Write something, or scroll.')
    }, 2800)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('ink:played', onPlay)
      window.removeEventListener('scroll', onScroll)
    }
  }, [ready])

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const scale = 0.58
      const lift = () => {
        const top = mark.current!.offsetTop
        const header = document.querySelector('.header')?.getBoundingClientRect().bottom ?? 80
        return Math.max(innerHeight * 0.12, header + 16) - top * scale
      }
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=220%', pin: true, scrub: true, invalidateOnRefresh: true },
      })
      gsap.set(root.current, { '--ink-presence': 0.26 })
      tl.to(root.current, { '--ink-presence': 1, duration: 0.42 }, 0)
        .to(root.current, { '--ink-presence': 0.4, duration: 0.58 }, 0.42)
        .to(stage.current, { y: () => lift(), scale, duration: 1 }, 0)
        .to('.tw', { autoAlpha: 0, y: -40, duration: 0.28 }, 0)
        .from('.pitch__line > span', { yPercent: 110, duration: 0.55, stagger: 0.11, ease: 'power3.out' }, 0.32)
        .from('.pitch__meta > *', { autoAlpha: 0, y: 22, duration: 0.48, stagger: 0.07, ease: 'power3.out' }, 0.7)
        .to({}, { duration: 0.12 })
    })
    return () => mm.revert()
  }, [])

  const lines = ['I design products,', 'build them myself,', 'and know their worth.']

  return (
    <section ref={root} id="top" className="hero">
      <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} track />
      <div className="hero__bloom" aria-hidden="true" />
      <div ref={stage} className="hero__stage">
        <div ref={mark} className="hero__mark" aria-hidden="true" />
      </div>
      <h1 className="sr-only">{site.fullName}</h1>
      <Typewriter onWrite={() => setHint(null)} invite={invite} />
      <p className="hero__hint" data-on={hint ? '' : undefined} aria-hidden="true">
        {hint}
      </p>
      <div className="hero__pitch">
        <p className="pitch__title">
          <span className="sr-only">{site.pitch}</span>
          {lines.map((l) => (
            <span key={l} className="pitch__line" aria-hidden="true">
              <span>{l}</span>
            </span>
          ))}
        </p>
        <div className="pitch__meta">
          <p className="pitch__status">
            <i aria-hidden="true" />
            {site.status}
          </p>
          <a
            href="#work"
            className="pitch__link"
            onClick={(e) => (e.preventDefault(), scrollToId('work'))}
          >
            <Roll>Enter the work</Roll>
          </a>
        </div>
      </div>
    </section>
  )
}
