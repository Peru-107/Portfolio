import { useEffect, useRef, useState } from 'react'
import { InkP } from '../hero/InkP'
import { experience, projects, site } from '../content'
import { linkProps } from '../lib/router'
import { STACK, WorkStack } from '../components/WorkStack'

// A private page with two directions for the homepage, each one screen tall.
// Not linked from the site; open /preview directly.

function EditorialIndex() {
  const mark = useRef<HTMLDivElement>(null)
  const items = STACK.map((s) => projects.find((p) => p.slug === s.slug)!)
  return (
    <section className="pv pv--a">
      <p className="pv__tag">A. Editorial index</p>
      <InkP play text={site.name} layout="wordmark" anchor={mark} />
      <div className="pva__cols">
        <div>
          <p className="pv__h">{site.fullName}</p>
          <p>MBA Tech student in Mumbai.</p>
          <p>Computer engineering and finance.</p>
          <p className="pv__dim">Open to product, front-end and fintech roles from 2027.</p>
        </div>
        <div>
          <p className="pv__h">Work</p>
          {items.map((p, i) => (
            <a key={p.slug} className="pv__link" {...linkProps(`/work/${p.slug}`)}>
              <span className="pv__num">{String(i + 1).padStart(2, '0')}</span>{p.title}
            </a>
          ))}
        </div>
        <div>
          <p className="pv__h">Experience</p>
          {experience.map((j) => (
            <p key={j.org}>{j.org} <span className="pv__dim">{j.when.split('–').pop()!.trim().slice(-4)}</span></p>
          ))}
          <p>Karate World Championship <span className="pv__dim">2018</span></p>
        </div>
        <div>
          <p className="pv__h">Contact</p>
          <a className="pv__link" href={`mailto:${site.email}`}>Email</a>
          {site.links.map((l) => <a key={l.label} className="pv__link" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>)}
          <a className="pv__link" href="/Perraz-Badhniwalla-CV.pdf" target="_blank" rel="noreferrer">CV</a>
        </div>
      </div>
      <p className="pva__line">I design products, build them myself, and know their worth.</p>
      <div ref={mark} className="pva__mark" aria-hidden="true" />
    </section>
  )
}

function ObjectInSpace() {
  const [active, setActive] = useState<number | null>(0)
  const pointing = useRef(false)
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      if (pointing.current) return
      i = (i + 1) % STACK.length
      setActive(i)
    }, 2400)
    return () => clearInterval(id)
  }, [])
  const choose = (i: number | null) => {
    pointing.current = i !== null
    if (i !== null) setActive(i)
  }
  const current = active === null ? null : projects.find((p) => p.slug === STACK[active]!.slug)
  return (
    <section className="pv pv--b">
      <p className="pv__tag">B. Object in space</p>
      <div className="pvb__object">
        <WorkStack active={active} onActive={choose} />
        <p className="pvb__caption">{current ? `${current.title}, ${current.kind.toLowerCase()}` : ''}</p>
      </div>
      <p className="pvb__line">
        <span>I design products,</span>
        <span>build them myself,</span>
        <span>and know their worth.</span>
      </p>
      <ol className="pvb__index">
        {STACK.map((s, i) => (
          <li key={s.slug} data-on={active === i || undefined} onPointerEnter={() => choose(i)} onPointerLeave={() => choose(null)}>
            <a {...linkProps(`/work/${s.slug}`)}>{String(i + 1).padStart(2, '0')}  {s.title}</a>
          </li>
        ))}
      </ol>
      <p className="pvb__meta">Mumbai. MBA Tech, computer engineering and finance.</p>
    </section>
  )
}

export function Preview() {
  useEffect(() => {
    document.title = 'Preview — two directions'
  }, [])
  return (
    <main>
      <EditorialIndex />
      <ObjectInSpace />
    </main>
  )
}
