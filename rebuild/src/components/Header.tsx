import { useEffect, useRef, useState } from 'react'
import { site } from '../content'
import { go, linkProps, usePath } from '../lib/router'
import { scrollToId } from '../lib/motion'
import { Roll } from './Roll'
import { Magnetic } from './Magnetic'
import { isMuted, setMuted } from '../lib/sound'

const NAV = [
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
]

export function Header() {
  const path = usePath()
  const root = useRef<HTMLElement>(null)
  const lens = useRef<HTMLSpanElement>(null)
  const [hide, setHide] = useState(false)
  const [prog, setProg] = useState(0)
  const [quiet, setQuiet] = useState(isMuted())
  const home = path === '/'

  useEffect(() => {
    let last = scrollY
    let ticking = 0
    const on = () => {
      if (ticking) return
      ticking = requestAnimationFrame(() => {
        ticking = 0
        const y = scrollY
        setHide(y > 120 && y > last)
        last = y
        const max = Math.max(1, document.documentElement.scrollHeight - innerHeight)
        setProg(Math.min(1, y / max))
        const dark = !!document.elementFromPoint(innerWidth / 2, 40)?.closest?.('.contact, .case--night')
        if (dark) root.current?.setAttribute('data-dark', '')
        else root.current?.removeAttribute('data-dark')
      })
    }
    addEventListener('scroll', on, { passive: true })
    on()
    return () => {
      removeEventListener('scroll', on)
      cancelAnimationFrame(ticking)
    }
  }, [path])

  useEffect(() => {
    const nav = root.current?.querySelector<HTMLElement>('.header__nav')
    const L = lens.current
    if (!nav || !L || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const move = (e: PointerEvent) => {
      const a = (e.target as Element)?.closest?.('a') as HTMLElement | null
      if (!a || !nav.contains(a)) return
      const nr = nav.getBoundingClientRect()
      const r = a.getBoundingClientRect()
      L.style.width = `${r.width}px`
      L.style.height = `${r.height}px`
      L.style.transform = `translate(${r.left - nr.left}px, ${r.top - nr.top}px)`
      L.dataset.on = ''
      nav.querySelectorAll('a').forEach((el) => {
        el.dataset.focus = el === a ? '1' : '0'
      })
    }
    const out = () => {
      delete L.dataset.on
      nav.querySelectorAll('a').forEach((el) => delete el.dataset.focus)
    }
    nav.addEventListener('pointermove', move)
    nav.addEventListener('pointerleave', out)
    return () => {
      nav.removeEventListener('pointermove', move)
      nav.removeEventListener('pointerleave', out)
    }
  }, [])

  const jump = (id: string) => {
    if (!home) {
      go('/')
      requestAnimationFrame(() => setTimeout(() => scrollToId(id), 80))
      return
    }
    scrollToId(id)
  }

  return (
    <header ref={root} className="header" data-hide={hide ? '' : undefined}>
      <a className="header__mark" {...(home ? { href: '#top', onClick: (e) => (e.preventDefault(), scrollToId('top')) } : linkProps('/'))}>
        <Roll>{site.name}</Roll>
      </a>
      <div className="header__meta" aria-hidden="true">
        <span className="header__cue">間</span>
        <span className="header__loc">{site.location}</span>
      </div>
      <nav className="header__nav" aria-label="Primary">
        <span ref={lens} className="header__lens" aria-hidden="true" />
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} onClick={(e) => (e.preventDefault(), jump(n.id))}>
            <Roll>{n.label}</Roll>
          </a>
        ))}
        <Magnetic>
          <button
            type="button"
            className="header__mute"
            aria-pressed={quiet}
            aria-label={quiet ? 'Unmute clicks' : 'Mute clicks'}
            onClick={() => {
              setMuted(!quiet)
              setQuiet(!quiet)
            }}
          >
            {quiet ? 'Sound off' : 'Sound on'}
          </button>
        </Magnetic>
      </nav>
      <span className="header__progress" style={{ transform: `scaleX(${prog})` }} aria-hidden="true" />
    </header>
  )
}
