import { useEffect, useRef } from 'react'
import { projects, site } from '../content'
import { gsap, reduced } from '../lib/motion'
import { linkProps } from '../lib/router'
import { Media } from './Media'

// Pinned on wide screens: vertical scroll drives a horizontal run of
// projects. Stacked on narrow screens.
export function Work() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(min-width: 960px) and (prefers-reduced-motion: no-preference)', () => {
      const t = track.current!
      const dist = () => t.scrollWidth - window.innerWidth
      const tween = gsap.to(t, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 },
      })
      gsap.to('.work__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } })
      t.querySelectorAll<HTMLElement>('.wp').forEach((p) => {
        gsap.from(p.querySelector('.wp__stage'), { scale: 0.9, rotate: 1.5, autoAlpha: 0.4, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 95%', end: 'left 40%', scrub: true } })
      })
    })
    if (!reduced()) {
      mm.add('(max-width: 959px)', () => {
        gsap.utils.toArray<HTMLElement>('.wp').forEach((p) =>
          gsap.from(p, { y: 60, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: p, start: 'top 85%' } }),
        )
      })
    }
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="work" className="work" aria-labelledby="work-title">
      <div ref={track} className="work__track">
        <header className="work__intro">
          <h2 id="work-title" className="work__title">Things I’ve built</h2>
          <p className="work__lede">Five of my own products from this year. I designed each one and wrote the code.</p>
        </header>
        {projects.map((p) => (
          <article key={p.slug} className="wp">
            <a className="wp__stage" {...linkProps(`/work/${p.slug}`)} data-cursor="Open" aria-label={`${p.title} case study`}>
              <Media m={p.cover} />
            </a>
            <div className="wp__meta">
              <p className="wp__kind">{p.kind}, {p.year}</p>
              <h3 className="wp__title">
                <a {...linkProps(`/work/${p.slug}`)} data-cursor="Open">{p.title}</a>
              </h3>
              <p className="wp__summary">{p.summary}</p>
            </div>
          </article>
        ))}
        <aside className="wp wp--teaser" aria-label={`${site.teaser.title}, ${site.teaser.label.toLowerCase()}`}>
          <div className="teaser">
            <p className="teaser__label"><i aria-hidden="true" />{site.teaser.label}</p>
            <p className="teaser__title" aria-hidden="true">{site.teaser.title}</p>
            <p className="teaser__line">{site.teaser.line}</p>
            <ul className="teaser__hints">
              {site.teaser.hints.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </div>
        </aside>
      </div>
      <div className="work__bar" aria-hidden="true"><i /></div>
    </section>
  )
}
