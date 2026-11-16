import { useEffect, useState } from 'react'
import { scrollToId } from '../lib/motion'

const SECTIONS = [
  { id: 'top', label: 'Ink' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Path' },
  { id: 'contact', label: 'Night' },
]

export function SideNav() {
  const [active, setActive] = useState('top')

  useEffect(() => {
    if (!matchMedia('(min-width: 1100px)').matches) return
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    if (!nodes.length) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (hit?.target?.id) setActive(hit.target.id)
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0, 0.2, 0.5] },
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])

  return (
    <nav className="side" aria-label="Sections">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          className="side__tick"
          data-active={active === s.id ? '' : undefined}
          aria-label={s.label}
          onClick={() => scrollToId(s.id)}
        >
          <span className="side__label">{s.label}</span>
        </button>
      ))}
    </nav>
  )
}