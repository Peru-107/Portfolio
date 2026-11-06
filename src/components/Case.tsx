import { useEffect, useRef, useState, type ReactNode } from 'react'
import { projects } from '../content'
import { Count } from './Count'
import { Roll } from './Roll'
import { linkProps } from '../lib/router'
import { scrollToId } from '../lib/motion'
import { Media } from './Media'
import { Contact } from './Contact'

// The four parts of every case study, in order; the rail beside them lists these
const PARTS = [
  { id: 'problem', label: 'The problem' },
  { id: 'does', label: 'What it does' },
  { id: 'stack', label: 'Built with' },
  { id: 'stands', label: 'Where it stands' },
]

export function Case({ slug }: { slug: string }) {
  const root = useRef<HTMLElement>(null)
  const [part, setPart] = useState(PARTS[0]!.id)
  const i = projects.findIndex((p) => p.slug === slug)
  const p = projects[i]
  const next = projects[(i + 1) % projects.length]!

  useEffect(() => {
    if (p) document.title = `${p.title}: ${p.kind} — Perraz Badhniwalla`
  }, [p])

  // The rail marks the part that crosses the middle of the screen
  useEffect(() => {
    setPart(PARTS[0]!.id)
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setPart(e.target.id.replace('case-', ''))
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    PARTS.forEach((s) => {
      const el = document.getElementById(`case-${s.id}`)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [slug])

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
    <section key="brief" id="case-problem" className="case__block case__brief" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">The problem</span></h2>
      <p data-reveal="fade">{p.brief}</p>
    </section>,
    <section key="did" id="case-does" className="case__block" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">What it does</span></h2>
      <ul className="case__did">
        {p.did.map((d) => <li key={d} data-reveal="fade">{d}</li>)}
      </ul>
    </section>,
    <section key="stack" id="case-stack" className="case__block" data-reveal="line">
      <h2><span className="mark" data-reveal="mark">Built with</span></h2>
      <p className="case__stack" data-reveal="fade">{p.stack}</p>
    </section>,
    <section key="outcome" id="case-stands" className="case__block case__outcome" data-reveal="line">
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
        <a className="case__back u" {...linkProps('/')}><Roll>All work</Roll></a>
        <h1 className="case__title" data-reveal="rise"><span>{p.title}</span></h1>
        <dl className="case__facts" data-reveal="line">
          <div><dt>Type</dt><dd>{p.kind}</dd></div>
          <div><dt>Role</dt><dd>{p.role}</dd></div>
          <div data-reveal="count"><dt>Year</dt><dd><Count>{p.year}</Count></dd></div>
          {p.link && (
            <div className="case__link">
              <dt className="sr-only">Live</dt>
              <dd><a href={p.link.href} target="_blank" rel="noreferrer">{p.link.label}</a></dd>
            </div>
          )}
        </dl>
        <p className="case__outcome-lead" data-reveal="fade">{p.summary}</p>
        <div className="case__stage">
          <Media m={p.cover} priority />
        </div>
        <div className="case__body">
          {/* Stays beside the story while it scrolls: what this is, and where you are in it */}
          <aside className="case__rail" aria-label="On this page">
            <p className="case__rail-name">{p.title}</p>
            <p className="case__rail-kind">{p.kind}, {p.year}</p>
            <ol className="case__rail-parts">
              {PARTS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#case-${s.id}`}
                    aria-current={part === s.id ? 'location' : undefined}
                    onClick={(e) => (e.preventDefault(), scrollToId(`case-${s.id}`))}
                  >
                    <Roll>{s.label}</Roll>
                  </a>
                </li>
              ))}
            </ol>
            {p.link && <a className="case__rail-link" href={p.link.href} target="_blank" rel="noreferrer">{p.link.label}</a>}
          </aside>
          <div className="case__flow">{flow}</div>
        </div>
        <a className="case__next" {...linkProps(`/work/${next.slug}`)} data-cursor="Next">
          <span>Next project</span>
          <strong><Roll>{next.title}</Roll></strong>
        </a>
      </main>
      <Contact />
    </>
  )
}
