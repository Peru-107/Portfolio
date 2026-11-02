import { useEffect, useState } from 'react'
import { site } from '../content'
import { go } from '../lib/router'
import { scrollToId } from '../lib/motion'
import { Magnetic } from './Magnetic'
import { Roll } from './Roll'

function useClock() {
  const fmt = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: site.timezone }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000)
    return () => clearInterval(id)
  }, [])
  return t
}

// Ink on paper; light only while it sits over the dark Contact section
function useOverDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    let raf = 0
    const check = () => {
      raf = 0
      const c = document.querySelector('.contact')?.getBoundingClientRect()
      const next = !!c && c.top < 40 && c.bottom > 40
      setDark((d) => (d === next ? d : next))
    }
    const on = () => (raf ||= requestAnimationFrame(check))
    addEventListener('scroll', on, { passive: true })
    addEventListener('resize', on)
    check()
    return () => {
      removeEventListener('scroll', on)
      removeEventListener('resize', on)
      cancelAnimationFrame(raf)
    }
  }, [])
  return dark
}

export function Header() {
  const time = useClock()
  const dark = useOverDark()
  const to = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      go('/')
      setTimeout(() => scrollToId(id), 900)
    } else scrollToId(id)
  }
  return (
    <header className="header" data-dark={dark || undefined}>
      <a href="/" className="header__mark" onClick={to('top')} aria-label={`${site.name}, home`}>
        {site.name}
      </a>
      <p className="header__meta">
        <span>{site.location}</span>
        <span className="header__time">{time}</span>
      </p>
      <nav className="header__nav" aria-label="Sections">
        <Magnetic><a href="/#work" onClick={to('work')}><Roll>Work</Roll></a></Magnetic>
        <Magnetic><a href="/#about" onClick={to('about')}><Roll>About</Roll></a></Magnetic>
        <Magnetic><a href="/#experience" onClick={to('experience')}><Roll>Experience</Roll></a></Magnetic>
        <Magnetic><a href="/#contact" onClick={to('contact')}><Roll>Contact</Roll></a></Magnetic>
        <Magnetic><a href="/Perraz-Badhniwalla-CV.pdf" target="_blank" rel="noreferrer"><Roll>CV</Roll></a></Magnetic>
      </nav>
    </header>
  )
}
