import { useEffect, useRef } from 'react'
import { InkP } from '../hero/InkP'
import { site } from '../content'
import { gsap, reduced, scrollToId } from '../lib/motion'

// The first screen is only my name in live ink. Scrolling reveals what I do:
// the headline rises line by line, then the details settle in under it.
export function Hero({ ready }: { ready: boolean }) {
  const pitch = useRef<HTMLElement>(null)
  const mark = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.from('.pitch__line > span', {
        yPercent: 110,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: { trigger: '.pitch__title', start: 'top 82%' },
      })
      gsap.from('.pitch__meta > *', {
        autoAlpha: 0,
        y: 18,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.pitch__meta', start: 'top 92%' },
      })
    }, pitch)
    return () => ctx.revert()
  }, [])

  const lines = ['I design products,', 'build them myself,', 'and know their worth.']

  return (
    <>
      <section id="top" className="hero">
        <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} />
        <h1 className="sr-only">{site.fullName}</h1>
        <div ref={mark} className="hero__mark" aria-hidden="true" />
      </section>

      <section ref={pitch} className="pitch" aria-label="What I do">
        <div className="pitch__copy">
          <p className="pitch__title" aria-label={site.pitch}>
            {lines.map((l) => (
              <span key={l} className="pitch__line" aria-hidden="true"><span>{l}</span></span>
            ))}
          </p>
        </div>
        <div className="pitch__meta">
          <p className="pitch__intro">{site.intro}</p>
          <p className="pitch__status"><i aria-hidden="true" />{site.status}</p>
          <a href="#work" className="pitch__link" onClick={(e) => (e.preventDefault(), scrollToId('work'))}>See what I’ve built</a>
        </div>
      </section>
    </>
  )
}
