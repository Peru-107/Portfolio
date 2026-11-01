import { useEffect, useRef, type ReactNode } from 'react'
import { projects } from '../content'
import { Count } from './Count'
import { linkProps } from '../lib/router'
import { Media } from './Media'
import { Contact } from './Contact'

export function Case({ slug }: { slug: string }) {
  const root = useRef<HTMLElement>(null)
  const i = projects.findIndex((p) => p.slug === slug)
  const p = projects[i]
  const next = projects[(i + 1) % projects.length]!

  useEffect(() => {
    if (p) document.title = `${p.title}: ${p.kind} — Perraz Badhniwalla`
  }, [p])

  if (!p) {
    return (
      <main className="case case--missing">
        <h1 className="case__title"><span>Not here</span></h1>
        <p>That project doesn’t exist. <a {...linkProps('/')}>Go back to the work</a></p>
      </main>
    )
  }

  // Long-form: text blocks and large images take turns down the page
  const blocks: ReactNode[] = [
    <section key="brief" className="case__block case__brief" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">The problem</span></h2>
      <p data-reveal="fade">{p.brief}</p>
    </section>,
    <section key="did" className="case__block" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">What it does</span></h2>
      <ul className="case__did">
        {p.did.map((d) => <li key={d} data-reveal="fade">{d}</li>)}
      </ul>
    </section>,
    <section key="stack" className="case__block" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">Built with</span></h2>
      <p className="case__stack" data-reveal="fade">{p.stack}</p>
    </section>,
    <section key="outcome" className="case__block case__outcome" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">Where it stands</span></h2>
      <p data-reveal="fade">{p.result}</p>
    </section>,
  ]
  const shots = p.gallery.map((g, k) => (
    <div key={`shot${k}`} className="case__shot" data-reveal="unveil"><Media m={g} /></div>
  ))
  const flow: ReactNode[] = []
  blocks.forEach((b, k) => {
    flow.push(b)
    // After every block but the last, one image; any left over follow the third block
    if (k < blocks.length - 1 && shots[k]) flow.push(shots[k])
    if (k === 2) flow.push(...shots.slice(3))
  })

  return (
    <>
      <main ref={root} className="case">
        <a className="case__back u" {...linkProps('/')}>All work</a>
        <h1 className="case__title" data-reveal="rise"><span>{p.title}</span></h1>
        <dl className="case__facts" data-reveal="line">
          <div><dt>Project</dt><dd>{p.kind}</dd></div>
          <div><dt>Role</dt><dd>{p.role}</dd></div>
          <div data-reveal="count"><dt>Year</dt><dd><Count>{p.year}</Count></dd></div>
          {p.link && (
            <div className="case__link">
              <a href={p.link.href} target="_blank" rel="noreferrer">{p.link.label}</a>
            </div>
          )}
        </dl>
        <p className="case__outcome-lead" data-reveal="fade">{p.summary}</p>
        <div className="case__stage">
          <Media m={p.cover} priority />
        </div>
        {flow}
        <a className="case__next" {...linkProps(`/work/${next.slug}`)} data-cursor="Next">
          <span>Next project</span>
          <strong>{next.title}</strong>
        </a>
      </main>
      <Contact />
    </>
  )
}
