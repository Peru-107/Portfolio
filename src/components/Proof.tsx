import { useEffect, useRef } from 'react'
import { site } from '../content'
import { gsap, reduced } from '../lib/motion'
import { WorkStack } from './WorkStack'

// Right after the hero: the evidence. The products themselves in depth on
// one side, and what else stands behind them on the other.
export function Proof() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.from('.proof__title', { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.proof', start: 'top 70%' } })
      gsap.from('.proof__point', { y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.proof__points', start: 'top 80%' } })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="proof" aria-labelledby="proof-title">
      <div className="proof__text">
        <h2 id="proof-title" className="proof__title">{site.proof.title}</h2>
        <dl className="proof__points">
          {site.proof.points.map((p) => (
            <div key={p.label} className="proof__point">
              <dt>{p.label}</dt>
              <dd>{p.body}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="proof__stack">
        <WorkStack bare enter cycle />
      </div>
    </section>
  )
}
