import { useEffect, useRef } from 'react'
import { projects, site } from '../content'
import { Media } from './Media'
import { Roll } from './Roll'
import { linkProps } from '../lib/router'
import { gsap, reduced } from '../lib/motion'
import { tick } from '../lib/haptic'

export function Work() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduced()) return
    const cards = root.current?.querySelectorAll<HTMLElement>('.chapter__media')
    if (!cards?.length || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const clean: Array<() => void> = []
    cards.forEach((el) => {
      const enter = () => gsap.to(el, { scale: 1.025, y: -6, duration: 0.45, ease: 'power3.out' })
      const leave = () => gsap.to(el, { scale: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      el.addEventListener('pointerenter', enter)
      el.addEventListener('pointerleave', leave)
      clean.push(() => {
        el.removeEventListener('pointerenter', enter)
        el.removeEventListener('pointerleave', leave)
      })
    })
    return () => clean.forEach((fn) => fn())
  }, [])

  return (
    <section ref={root} id="work" className="work" aria-labelledby="work-title">
      <header className="work__head">
        <p className="work__cue" data-reveal="fade">
          作 · Work
        </p>
        <h2 id="work-title" className="work__title" data-reveal="rise">
          <span>Things I’ve built.</span>
        </h2>
        <p className="work__lead" data-reveal="fade">
          {site.workLead}
        </p>
      </header>

      <ol className="work__chapters">
        {projects.map((p, i) => {
          const nav = linkProps(`/work/${p.slug}`, true)
          return (
          <li key={p.slug} className="chapter" data-tone={p.tone} data-reveal="line">
            <a
              className="chapter__link"
              {...nav}
              data-cursor="Open"
              onClick={(e) => {
                tick()
                nav.onClick(e)
              }}
            >
              <div className="chapter__meta">
                <span className="chapter__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="chapter__role">
                  {p.role} · {p.year}
                </span>
              </div>
              <h3 className="chapter__title">{p.title}</h3>
              <p className="chapter__kind">{p.kind}</p>
              <p className="chapter__summary">{p.summary}</p>
              <div className="chapter__media" data-reveal="unveil">
                <Media m={p.cover} priority={i === 0} sizes="(max-width: 759px) 92vw, 42vw" />
              </div>
              <span className="chapter__cta">
                <Roll>Read the story</Roll>
              </span>
            </a>
          </li>
          )
        })}
      </ol>

      <aside className="work__teaser" data-reveal="fade" aria-label={site.teaser.title}>
        <p className="work__teaser-label">{site.teaser.label}</p>
        <h3 className="work__teaser-title">{site.teaser.title}</h3>
        <p className="work__teaser-line">{site.teaser.line}</p>
      </aside>
    </section>
  )
}
