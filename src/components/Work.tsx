import { useEffect, useRef } from 'react'
import { projects, site } from '../content'
import { gsap } from '../lib/motion'
import { linkProps } from '../lib/router'
import { Media } from './Media'

// The work as one object that changes with the scroll: the projects start
// stacked in depth, deal out into a row, then the row slides past. Each
// project appears once. Phones and reduced motion get a plain vertical list.
export function Work() {
  const root = useRef<HTMLElement>(null)
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 960px) and (prefers-reduced-motion: no-preference)', () => {
      const r = row.current!
      const cards = gsap.utils.toArray<HTMLElement>('.w2__card', r)
      const caps = gsap.utils.toArray<HTMLElement>('.w2__cap', r)
      const cardW = () => cards[0]!.offsetWidth
      const gap = () => innerWidth * 0.04
      const start = () => innerWidth * 0.06
      const slot = (i: number) => start() + i * (cardW() + gap())
      const travel = () => Math.max(0, slot(cards.length - 1) + cardW() + start() - innerWidth)
      const length = () => innerHeight * 1.2 + travel()

      // Stacked: on the right, each card further back and turned away
      gsap.set(cards, {
        x: (i) => innerWidth * 0.46 + i * 46,
        y: (i) => i * -16,
        z: (i) => i * -90,
        rotationY: -26,
        rotationX: 10,
        zIndex: (i) => cards.length - i,
      })
      gsap.set(caps, { autoAlpha: 0, y: 10 })

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${length()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      })
      // Dealt: each card flies to its place in a flat row
      cards.forEach((c, i) => {
        tl.to(c, { x: () => slot(i), y: 0, z: 0, rotationY: 0, rotationX: 0, duration: 1 }, i * 0.08)
      })
      tl.to(caps, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' }, 0.75)
      // Then the whole row slides past, at the same pace the page scrolls
      tl.to(r, { x: () => -travel(), ease: 'none', duration: 0.6 + (travel() / innerWidth) * 1.4 }, '+=0.15')

      gsap.to('.w2__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${length()}`, scrub: true, invalidateOnRefresh: true } })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="work" className="w2" aria-labelledby="work-title">
      <header className="w2__head">
        <h2 id="work-title" className="w2__title">Things I’ve <span className="accent">built.</span></h2>
      </header>
      <div ref={row} className="w2__row">
        {projects.map((p) => (
          <a key={p.slug} className="w2__card" {...linkProps(`/work/${p.slug}`)} data-cursor="Open" aria-label={`${p.title}, ${p.kind}. Open case study`}>
            <div className="w2__media"><Media m={p.cover} /></div>
            <div className="w2__cap">
              <p className="w2__kind">{p.kind}, {p.year}</p>
              <p className="w2__name">{p.title}</p>
            </div>
          </a>
        ))}
        <aside className="w2__card w2__card--teaser" aria-label={`${site.teaser.title}, ${site.teaser.label.toLowerCase()}`}>
          <div className="w2__media teaser">
            <p className="teaser__label"><i aria-hidden="true" />{site.teaser.label}</p>
            <p className="teaser__title" aria-hidden="true">{site.teaser.title}</p>
            <p className="teaser__line">{site.teaser.line}</p>
          </div>
          <div className="w2__cap">
            <p className="w2__kind">In the works</p>
            <p className="w2__name">{site.teaser.title}</p>
          </div>
        </aside>
      </div>
      <div className="w2__bar" aria-hidden="true"><i /></div>
    </section>
  )
}
