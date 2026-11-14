import { useEffect, useRef } from 'react'
import { projects, site } from '../content'
import { gsap } from '../lib/motion'
import { linkProps } from '../lib/router'
import { tick } from '../lib/haptic'
import { Media } from './Media'
import { Roll } from './Roll'

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
          // A short, quick settle: a tap right after a flick lands on a still card
          snap: stepped ? { snapTo: 'labelsDirectional', duration: { min: 0.15, max: 0.3 }, delay: 0.04, ease: 'power3.out', onComplete: () => tick() } : undefined,
        },
      })
      let undo: (() => void) | undefined
      tl.addLabel('start', 0)
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
        // No hover under a thumb: the card resting in the middle is the one that
        // resolves from halftone dots into its full picture
        root.current!.setAttribute('data-steps', '')
        let on = -1
        tl.eventCallback('onUpdate', () => {
          const t = tl.time()
          let best = -1
          let d = Infinity
          cards.forEach((_, i) => {
            const dd = Math.abs(t - tl.labels[`card${i}`]!)
            if (dd < d) (d = dd), (best = i)
          })
          if (t < tl.labels.card0! - 0.1) best = -1
          if (best === on) return
          cards[on]?.removeAttribute('data-on')
          on = best
          cards[on]?.setAttribute('data-on', '')
        })
        undo = () => {
          root.current?.removeAttribute('data-steps')
          cards.forEach((c) => c.removeAttribute('data-on'))
        }
      } else {
        // Then the whole row slides past, at the same pace the page scrolls
        tl.to(r, { x: () => -travel(), ease: 'none', duration: 0.6 + (travel() / innerWidth) * 1.4 }, '+=0.15')
      }

      gsap.to('.w2__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${length()}`, scrub: true, invalidateOnRefresh: true } })
      return undo
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="work" className="w2" aria-labelledby="work-title">
      <header className="w2__head">
        <h2 id="work-title" className="w2__title">Things I’ve <span className="accent">built.</span></h2>
        <p className="w2__lead">{site.proof.title}</p>
      </header>
      <div ref={row} className="w2__row">
        {projects.map((p) => (
          <a key={p.slug} className="w2__card" {...linkProps(`/work/${p.slug}`, true)} data-cursor="Open" aria-label={`${p.title}, ${p.kind}. Open case study`}>
            <div className="w2__media"><Media m={p.cover} /></div>
            {/* Phones held upright get tall cards; their images load only there */}
            {p.portrait && <div className="w2__media w2__media--portrait"><Media m={p.portrait} /></div>}
            <div className="w2__cap">
              <p className="w2__kind">{p.kind}, {p.year}</p>
              <p className="w2__name"><Roll>{p.title}</Roll></p>
            </div>
          </a>
        ))}
        <div role="group" className="w2__card w2__card--teaser" aria-label={`${site.teaser.title}, ${site.teaser.label.toLowerCase()}`}>
          {/* A sealed folder: the front lifts a little and a redacted page shows, but it never opens */}
          <div className="w2__media teaser folder">
            <span className="folder__back" aria-hidden="true" />
            <span className="folder__sheet" aria-hidden="true"><i /><i /><i /><i /></span>
            <div className="folder__front">
              <p className="teaser__label"><i aria-hidden="true" />{site.teaser.label}</p>
              <p className="teaser__title" aria-hidden="true">{site.teaser.title}</p>
              <p className="teaser__line">{site.teaser.line}</p>
            </div>
          </div>
          <div className="w2__cap">
            <p className="w2__kind">Research desk for Indian markets</p>
            <p className="w2__name">{site.teaser.title}</p>
          </div>
        </div>
      </div>
      <div className="w2__bar" aria-hidden="true"><i /></div>
    </section>
  )
}
