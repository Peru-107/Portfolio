import { useEffect, useRef } from 'react'
import { InkP } from '../hero/InkP'
import { site } from '../content'
import { gsap, scrollToId } from '../lib/motion'
import { Magnetic } from './Magnetic'

// Two things only: the name in live ink, and what I can do for you.
// The ink word is drawn into the box the page leaves for it (.hero__mark),
// so it can never collide with the text at any screen size.
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const mark = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.from('.hero__pitch .hero__line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.07, delay: 0.4 })
      gsap.from('.hero__side > *', { autoAlpha: 0, y: 16, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.8 })
    }, root)
    return () => ctx.revert()
  }, [ready])

  // The pitch breaks where I choose, not where the column happens to end
  const lines = ['I design products,', 'build them myself,', 'and know their worth.']

  return (
    <section ref={root} id="top" className="hero">
      <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} />
      <h1 className="sr-only">{site.fullName}</h1>
      <div ref={mark} className="hero__mark" aria-hidden="true" />
      <div className="hero__body">
        <p className="hero__pitch" aria-label={site.pitch}>
          {lines.map((l) => (
            <span key={l} className="hero__line" aria-hidden="true"><span>{l}</span></span>
          ))}
        </p>
        <div className="hero__side">
          <p className="hero__intro">{site.intro}</p>
          <div className="hero__ctas">
            <Magnetic strength={0.2}>
              <a href="#work" className="btn btn--solid" onClick={(e) => (e.preventDefault(), scrollToId('work'))}>See the work</a>
            </Magnetic>
            <Magnetic strength={0.2}>
              <a href="/Perraz-Badhniwalla-CV.pdf" className="btn" download>Download CV</a>
            </Magnetic>
          </div>
          <p className="hero__status"><i aria-hidden="true" />{site.status}</p>
        </div>
      </div>
    </section>
  )
}
