import { useEffect, useRef, useState, type ReactNode } from 'react'
import { projects, type Media as M } from '../content'
import { Count } from './Count'
import { Roll } from './Roll'
import { back, linkProps } from '../lib/router'
import { gsap, scrollToId } from '../lib/motion'
import { Media } from './Media'
import { Contact } from './Contact'
import { Depth, type Shot } from './Depth'

// Every still picture a project has, for the screens carousel
function pictures(m: M | undefined): Shot[] {
  if (!m) return []
  if (m.type === 'image') return [{ src: m.src, alt: m.alt }]
  if (m.type === 'video') return [{ src: m.poster, alt: m.alt }]
  return m.srcs.map((src) => ({ src, alt: m.alt }))
}

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

  // Scroll zoom: the cover waits small between two words, then grows to fill
  // the screen as you scroll, the words parting to make room
  useEffect(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const zoom = root.current?.querySelector<HTMLElement>('.case__zoom')
      const stage = zoom?.querySelector<HTMLElement>('.case__stage')
      if (!zoom || !stage) return
      const cover = () => Math.max(innerWidth / stage.offsetWidth, innerHeight / stage.offsetHeight) * 1.002
      // The words sit level with the cover's middle while it waits at the top of the band
      const flanks = zoom.querySelectorAll<HTMLElement>('.case__flank')
      const level = () => flanks.forEach((f) => (f.style.top = `${stage.offsetHeight / 2}px`))
      level()
      const st = { trigger: zoom, start: 'top top', end: '+=110%', scrub: true, invalidateOnRefresh: true }
      // Waits small just under the summary, then travels to the middle as it grows to fill the screen
      gsap.fromTo(
        stage,
        { scale: () => (innerWidth < 760 ? 0.86 : 0.6), y: 0 },
        { scale: cover, y: () => (zoom.offsetHeight - stage.offsetHeight) / 2, ease: 'none', scrollTrigger: { ...st, pin: true, onRefreshInit: level } },
      )
      gsap.to(zoom.querySelector('.case__flank--l'), { xPercent: -70, autoAlpha: 0, ease: 'none', scrollTrigger: { ...st, end: '+=55%' } })
      gsap.to(zoom.querySelector('.case__flank--r'), { xPercent: 70, autoAlpha: 0, ease: 'none', scrollTrigger: { ...st, end: '+=55%' } })
    })
    return () => mm.revert()
  }, [slug])

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
  // All its screens, once each, in one carousel after "What it does"
  const seen = new Set<string>()
  const shots = [...p.gallery, p.portrait, p.cover].flatMap(pictures).filter((s) => !seen.has(s.src) && seen.add(s.src))
  const flow: ReactNode[] = [...blocks]
  flow.splice(2, 0, (
    <section key="screens" className="case__screens" data-reveal="fade">
      <Depth shots={shots} label={`${p.title} screens`} />
    </section>
  ))
  const [lead, ...rest] = p.role.split(' ')

  return (
    <>
      <main ref={root} className="case">
        <a className="case__back u" href="/" onClick={(e) => (e.preventDefault(), back('/'))}><Roll>All work</Roll></a>
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
        <div className="pin-wrap case__zoomwrap">
          <div className="case__zoom">
            <span className="case__flank case__flank--l" aria-hidden="true">{lead}</span>
            <div className="case__stage">
              <Media m={p.cover} priority />
            </div>
            <span className="case__flank case__flank--r" aria-hidden="true">{rest.join(' ')}</span>
          </div>
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
