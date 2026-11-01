import { useEffect, useRef } from 'react'
import { InkP } from '../hero/InkP'
import { site } from '../content'
import { gsap, scrollToId } from '../lib/motion'

// One idea on this screen: my name in live ink, and what I do in one line.
// The ink word is drawn into the box the page leaves for it (.hero__mark),
// so it always keeps its distance from the text.
export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const mark = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.from('.hero__line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.08, delay: 0.35 })
      gsap.from('.hero__meta > *', { autoAlpha: 0, y: 12, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.9 })
    }, root)
    return () => ctx.revert()
  }, [ready])

  const lines = ['I design products,', 'build them myself,', 'and know their worth.']

  return (
    <section ref={root} id="top" className="hero">
      <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} />
      <h1 className="sr-only">{site.fullName}</h1>
      <div ref={mark} className="hero__mark" aria-hidden="true" />
      <div className="hero__copy">
        <p className="hero__title" aria-label={site.pitch}>
          {lines.map((l) => (
            <span key={l} className="hero__line" aria-hidden="true"><span>{l}</span></span>
          ))}
        </p>
      </div>
      <div className="hero__meta">
        <p className="hero__intro">{site.intro}</p>
        <p className="hero__status"><i aria-hidden="true" />{site.status}</p>
        <a href="#work" className="hero__scroll" onClick={(e) => (e.preventDefault(), scrollToId('work'))}>See what I’ve built</a>
      </div>
    </section>
  )
}
