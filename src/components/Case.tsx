import { useEffect, useRef } from 'react'
import { projects } from '../content'
import { gsap, reduced } from '../lib/motion'
import { linkProps } from '../lib/router'
import { Media } from './Media'
import { Contact } from './Contact'

export function Case({ slug }: { slug: string }) {
  const root = useRef<HTMLElement>(null)
  const i = projects.findIndex((p) => p.slug === slug)
  const p = projects[i]
  const next = projects[(i + 1) % projects.length]!

  useEffect(() => {
    if (!p) return
    document.title = `${p.title}: ${p.kind} — Perraz Badhniwalla`
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.from('.case__title > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', delay: 0.25 })
      gsap.from('.case__facts > div', { autoAlpha: 0, y: 14, stagger: 0.06, duration: 0.7, ease: 'power3.out', delay: 0.5 })
      gsap.from('.case__stage', { clipPath: 'inset(12% 8% 12% 8% round 24px)', duration: 1.4, ease: 'expo.out', delay: 0.4 })
      gsap.utils.toArray<HTMLElement>('.case__block, .case__shot').forEach((b) => gsap.from(b, { y: 50, autoAlpha: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: b, start: 'top 88%' } }))
    }, root)
    return () => ctx.revert()
  }, [p])

  if (!p) {
    return (
      <main className="case case--missing">
        <h1 className="case__title"><span>Not here</span></h1>
        <p>That project doesn’t exist. <a {...linkProps('/')}>Go back to the work</a></p>
      </main>
    )
  }

  return (
    <>
      <main ref={root} className="case">
        <a className="case__back" {...linkProps('/')}>All work</a>
        <h1 className="case__title"><span>{p.title}</span></h1>
        <dl className="case__facts">
          <div><dt>Project</dt><dd>{p.kind}</dd></div>
          <div><dt>Role</dt><dd>{p.role}</dd></div>
          <div><dt>Year</dt><dd>{p.year}</dd></div>
          {p.link && (
            <div className="case__link">
              <a href={p.link.href} target="_blank" rel="noreferrer">{p.link.label}</a>
            </div>
          )}
        </dl>
        <div className="case__stage">
          <Media m={p.cover} priority />
        </div>
        <section className="case__block case__brief">
          <h2>The problem</h2>
          <p>{p.brief}</p>
        </section>
        <section className="case__block">
          <h2>What it does</h2>
          <ul className="case__did">
            {p.did.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </section>
        {p.gallery.length > 0 && (
          <div className="case__gallery" data-count={p.gallery.length}>
            {p.gallery.map((g, k) => (
              <div key={k} className="case__shot"><Media m={g} /></div>
            ))}
          </div>
        )}
        <section className="case__block">
          <h2>Built with</h2>
          <p className="case__stack">{p.stack}</p>
        </section>
        <section className="case__block case__outcome">
          <h2>Where it stands</h2>
          <p>{p.result}</p>
        </section>
        <a className="case__next" {...linkProps(`/work/${next.slug}`)} data-cursor="Next">
          <span>Next project</span>
          <strong>{next.title}</strong>
        </a>
      </main>
      <Contact />
    </>
  )
}
