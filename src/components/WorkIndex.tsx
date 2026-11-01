import { useEffect, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import { projects } from '../content'
import { gsap, reduced } from '../lib/motion'
import { linkProps } from '../lib/router'
import { STACK, WorkStack } from './WorkStack'

// The opener of the work: a numbered index beside the stack. Pointing at a
// name lifts that exact card; clicking either opens the project. When nobody
// is pointing, the stack slowly shows each project in turn.
export function WorkIndex() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const pointing = useRef(false)

  const choose = (i: number | null) => {
    pointing.current = i !== null
    setActive(i)
  }

  useEffect(() => {
    if (reduced()) return
    let i = -1
    const id = setInterval(() => {
      if (pointing.current) return
      i = (i + 1) % STACK.length
      setActive(i)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (reduced()) return
    const ctx = gsap.context(() => {
      gsap.from('.wi__title, .wi__lede', { y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: root.current, start: 'top 70%' } })
    }, root)
    // The index cascades in with anime.js: numbers first, then the names slide after them
    const list = root.current!.querySelector('.wi__list')!
    const items = list.querySelectorAll<HTMLElement>('.wi__item')
    items.forEach((el) => (el.style.opacity = '0'))
    const io = new IntersectionObserver(([e]) => {
      if (!e!.isIntersecting) return
      io.disconnect()
      animate(items, { opacity: [0, 1], translateY: ['0.8em', '0em'], duration: 900, delay: stagger(70), ease: 'outExpo' })
      animate(list.querySelectorAll('.wi__name'), { translateX: ['-0.6em', '0em'], duration: 1100, delay: stagger(70, { start: 120 }), ease: 'outExpo' })
    }, { threshold: 0.3 })
    io.observe(list)
    return () => {
      ctx.revert()
      io.disconnect()
    }
  }, [])

  // The index follows the stack's order; titles and kinds come from the projects
  const items = STACK.map((s) => projects.find((p) => p.slug === s.slug)!)

  return (
    <section ref={root} id="work" className="wi" aria-labelledby="work-title">
      <div className="wi__text">
        <h2 id="work-title" className="wi__title">Things I’ve built</h2>
        <p className="wi__lede">Five products this year. I designed each one and wrote the code.</p>
        <ol className="wi__list">
          {items.map((p, i) => (
            <li key={p.slug} className="wi__item" data-active={active === i || undefined}>
              <a
                {...linkProps(`/work/${p.slug}`)}
                onPointerEnter={() => choose(i)}
                onPointerLeave={() => choose(null)}
                onFocus={() => choose(i)}
                onBlur={() => choose(null)}
              >
                <span className="wi__num">{String(i + 1).padStart(2, '0')}</span>
                <span className="wi__name">{p.title}</span>
                <span className="wi__kind">{p.kind}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
      <div className="wi__stack">
        <WorkStack active={active} onActive={choose} />
      </div>
    </section>
  )
}
