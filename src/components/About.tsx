import { useEffect, useRef } from 'react'
import { site } from '../content'
import { gsap, reduced } from '../lib/motion'
import { Count } from './Count'
import { Marked } from './Marked'

export function About() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      // The statement inks in word by word as it is read
      gsap.fromTo('.about__lead .w', { opacity: 0.14 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.about__lead', start: 'top 80%', end: 'bottom 45%', scrub: true } })
    }, root)
    return () => ctx.revert()
  }, [])
  const [lead, rest] = site.about
  return (
    <section ref={root} id="about" className="about" aria-labelledby="about-title">
      <h2 id="about-title" className="about__title">About</h2>
      <p className="about__lead">
        {(() => {
          // Everything after the colon, up to the full stop, is the point: it's set in magma
          let on = false
          return lead!.split(' ').map((w, i) => {
            const accent = on
            if (w.endsWith(':')) on = true
            if (accent && w.endsWith('.')) on = false
            return <span key={i} className={accent ? 'w accent' : 'w'}>{w} </span>
          })
        })()}
      </p>
      <dl className="pitch__facts about__facts" data-reveal="line">
        {site.facts.map((f, i) => (
          <div key={f.k} data-reveal="fade" style={{ ['--i' as string]: i }}>
            <dt>{f.k}</dt>
            <dd data-reveal="count">{/^\d+$/.test(f.v) ? <Count>{f.v}</Count> : f.v}</dd>
          </div>
        ))}
      </dl>
      <p className="about__rest" data-reveal="fade"><Marked>{rest!}</Marked></p>
      <div className="about__tools">
        {site.tools.map((t, i) => (
          <div key={t.group} className="about__group" data-reveal="fade" style={{ ['--i' as string]: i }}>
            <h3 data-reveal="line">{t.group}</h3>
            <ul>
              {t.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
