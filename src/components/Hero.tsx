import { useEffect, useRef } from 'react'
import { InkP } from '../hero/InkP'
import { site } from '../content'
import { gsap, scrollToId } from '../lib/motion'
import { WorkStack } from './WorkStack'

// The name in live ink across the top; the headline and the work in depth
// below it. The ink word is drawn into the box the page leaves for it
// (.hero__mark), so it always keeps its distance from the text.
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const mark = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.from('.hero__line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.35 })
      gsap.from('.hero__foot > *', { autoAlpha: 0, y: 12, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.9 })
    }, root)
    return () => ctx.revert()
  }, [ready])

  return (
    <section ref={root} id="top" className="hero">
      <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} />
      <h1 className="sr-only">{site.fullName}</h1>
      <div ref={mark} className="hero__mark" aria-hidden="true" />
      <div className="hero__body">
        <div className="hero__copy">
          <p className="hero__title">
            <span className="hero__line"><span>Designs the interface.</span></span>
            <span className="hero__line"><span>Then builds it.</span></span>
          </p>
          <p className="hero__intro">{site.intro}</p>
        </div>
        <div className="hero__stack">
          {ready && <WorkStack bare enter />}
        </div>
      </div>
      <div className="hero__foot">
        <p className="hero__pitch"><i aria-hidden="true" />{site.pitch}</p>
        <a href="#work" className="btn btn--solid" onClick={(e) => (e.preventDefault(), scrollToId('work'))}>
          See the work
        </a>
      </div>
    </section>
  )
}
