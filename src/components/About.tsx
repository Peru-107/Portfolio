import { useEffect, useRef } from 'react'
import { site } from '../content'
import { gsap, reduced } from '../lib/motion'

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
        {lead!.split(' ').map((w, i) => (
          <span key={i} className="w">{w} </span>
        ))}
      </p>
      <p className="about__rest">{rest}</p>
      <p className="about__now"><i aria-hidden="true" />{site.now}</p>
      <div className="about__tools">
        {site.tools.map((t) => (
          <div key={t.group} className="about__group">
            <h3>{t.group}</h3>
            <ul>
              {t.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
