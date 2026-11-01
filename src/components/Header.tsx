import { useEffect, useState } from 'react'
import { site } from '../content'
import { go } from '../lib/router'
import { scrollToId } from '../lib/motion'
import { Magnetic } from './Magnetic'

function useClock() {
  const fmt = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: site.timezone }).format(new Date())
  const [t, setT] = useState(fmt)
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 15000)
    return () => clearInterval(id)
  }, [])
  return t
}

export function Header({ dark }: { dark?: boolean }) {
  const time = useClock()
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
        <Magnetic><a href="/#work" onClick={to('work')}>Work</a></Magnetic>
        <Magnetic><a href="/#about" onClick={to('about')}>About</a></Magnetic>
        <Magnetic><a href="/#experience" onClick={to('experience')}>Experience</a></Magnetic>
        <Magnetic><a href="/#contact" onClick={to('contact')}>Contact</a></Magnetic>
        <Magnetic><a href="/Perraz-Badhniwalla-CV.pdf" target="_blank" rel="noreferrer" className="header__cv">CV</a></Magnetic>
      </nav>
    </header>
  )
}
