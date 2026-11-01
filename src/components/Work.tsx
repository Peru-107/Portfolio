import { useEffect, useRef } from 'react'
import { projects, site } from '../content'
import { gsap } from '../lib/motion'
import { linkProps } from '../lib/router'
import { tick } from '../lib/haptic'
import { Media } from './Media'

// The work as one object that changes with the scroll: the projects start
// stacked in depth, deal out into a row, then the row slides past. Each
// project appears once, on phones as on desktop. Reduced motion gets a plain list.
export function Work() {
  const root = useRef<HTMLElement>(null)
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    // Rebuilt when the screen crosses 960px: wide screens slide, narrow ones step card by card
    mm.add({ wideScreen: '(min-width: 960px)', motion: '(prefers-reduced-motion: no-preference)' }, (c) => {
      if (!c.conditions!.motion) return
      const stepped = !c.conditions!.wideScreen
      const r = row.current!
      const cards = gsap.utils.toArray<HTMLElement>('.w2__card', r)
      const caps = gsap.utils.toArray<HTMLElement>('.w2__cap', r)
      const cardW = () => cards[0]!.offsetWidth
      const wide = () => innerWidth >= 960
      const gap = () => innerWidth * (wide() ? 0.04 : 0.05)
      const start = () => innerWidth * (wide() ? 0.06 : 0.09)
      const slot = (i: number) => start() + i * (cardW() + gap())
      const travel = () => Math.max(0, slot(cards.length - 1) + cardW() + start() - innerWidth)
      const length = () => innerHeight * 1.2 + travel()

      // Stacked: on the right (centred on narrow screens), each card further back and turned away
      gsap.set(cards, {
        x: (i) => (wide() ? innerWidth * 0.46 + i * 46 : (innerWidth - cardW()) / 2 + i * 14),
        y: (i) => i * (wide() ? -16 : -10),
        z: (i) => i * -90,
        rotationY: -26,
        rotationX: 10,
        zIndex: (i) => cards.length - i,
      })
      gsap.set(caps, { autoAlpha: 0, y: 10 })

      // Linear against the scroll, so the deal never seems to stall. On phones the
      // deck settles on one card at a time under the thumb, with a small tick
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${length()}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          snap: stepped ? { snapTo: 'labels', duration: { min: 0.2, max: 0.45 }, delay: 0.08, ease: 'power3.out', onComplete: () => tick() } : undefined,
        },
      })
      // Dealt: each card flies to its place in a flat row
      cards.forEach((c, i) => {
        tl.to(c, { x: () => slot(i), y: 0, z: 0, rotationY: 0, rotationX: 0, duration: 1 }, i * 0.08)
      })
      tl.to(caps, { autoAlpha: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' }, 0.75)
      if (stepped) {
        // One card centred at a time; each stop is a place the scroll can rest
        const centre = (i: number) => -(slot(i) - (innerWidth - cardW()) / 2)
        tl.to(r, { x: () => centre(0), duration: 0.2 }, '+=0.1').addLabel('card0')
        for (let i = 1; i < cards.length; i++) tl.to(r, { x: () => centre(i), duration: 0.5 }).addLabel(`card${i}`)
      } else {
        // Then the whole row slides past, at the same pace the page scrolls
        tl.to(r, { x: () => -travel(), ease: 'none', duration: 0.6 + (travel() / innerWidth) * 1.4 }, '+=0.15')
      }

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
          <a key={p.slug} className="w2__card" {...linkProps(`/work/${p.slug}`, true)} data-cursor="Open" aria-label={`${p.title}, ${p.kind}. Open case study`}>
            <div className="w2__media"><Media m={p.cover} /></div>
            {/* Phones held upright get tall cards; their images load only there */}
            {p.portrait && <div className="w2__media w2__media--portrait"><Media m={p.portrait} /></div>}
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
