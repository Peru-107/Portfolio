import { useEffect, useState } from 'react'
import { scrollToId } from '../lib/motion'

// The home page's index: thin lines down the left edge, one per section. The
// section you are in draws its line long in magma; pointing at the index
// shows the names. It stays out of the hero and only appears on wide screens.

const PARTS = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

export function SideNav() {
  const [on, setOn] = useState<string | null>(null)

  useEffect(() => {
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting)
        // The last section crossing the middle of the screen is the one you're in
        setOn(PARTS.map((s) => s.id).filter((id) => seen.get(id)).pop() ?? null)
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    PARTS.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  return (
    <nav className="sidenav" aria-label="Sections on this page" data-on={on || undefined} data-dark={on === 'contact' || undefined}>
      <ol>
        {PARTS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={on === s.id ? 'location' : undefined}
              onClick={(e) => (e.preventDefault(), scrollToId(s.id))}
            >
              <i aria-hidden="true" />
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
