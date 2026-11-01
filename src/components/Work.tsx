import { useEffect, useRef } from 'react'
import { projects, site } from '../content'
import { gsap } from '../lib/motion'
import { linkProps } from '../lib/router'
import { Media } from './Media'

// The work as a plain grid that scrolls normally. As it comes into view the
// cards fly out of a stack into their places, once. No pinning.
export function Work() {
  const root = useRef<HTMLElement>(null)
  const grid = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
      const g = grid.current!
      const cards = gsap.utils.toArray<HTMLElement>('.w2__card', g)
      // Each card starts in a loose 3D stack at the centre-top of the grid
      const from = (c: HTMLElement, i: number) => {
        const gr = g.getBoundingClientRect()
        const cr = c.getBoundingClientRect()
        return {
          x: gr.left + gr.width / 2 - (cr.left + cr.width / 2) + i * 18,
          y: gr.top + Math.min(cr.height, 320) / 2 - (cr.top + cr.height / 2) - i * 10,
        }
      }
      const tween = gsap.from(cards, {
        x: (i: number, c: HTMLElement) => from(c, i).x,
        y: (i: number, c: HTMLElement) => from(c, i).y,
        rotationY: -24,
        rotationX: 10,
        scale: 0.7,
        zIndex: (i: number) => cards.length - i,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.09,
        scrollTrigger: { trigger: g, start: 'top 75%', once: true },
      })
      gsap.from('.w2__cap', { autoAlpha: 0, y: 12, duration: 0.7, stagger: 0.09, delay: 0.5, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 75%', once: true } })
      return () => tween.scrollTrigger?.kill()
    })
    mm.add('(max-width: 759px) and (prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('.w2__card').forEach((c) =>
        gsap.from(c, { y: 50, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 88%' } }),
      )
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="work" className="w2" aria-labelledby="work-title">
      <header className="w2__head">
        <h2 id="work-title" className="w2__title">Things I’ve <span className="accent">built.</span></h2>
      </header>
      <div ref={grid} className="w2__grid">
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
    </section>
  )
}
