import { useEffect, useRef, useState } from 'react'
import { site } from '../content'
import { go } from '../lib/router'
import { gsap, reduced, scrollToId, ScrollTrigger } from '../lib/motion'
import { Magnetic } from './Magnetic'
import { Roll } from './Roll'
import { OPEN_PALETTE } from './Palette'
import { isMuted, onMuted, play, setMuted } from '../lib/sound'

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

// Out of the way while you read down the page, back the moment you scroll up.
// Past the top it sits on its own bar, so no big title can run through it
function useBar() {
  const [bar, setBar] = useState<'top' | 'shown' | 'hidden'>('top')
  // Far enough down that a way back up is worth offering (clear of the hero's own links)
  const [far, setFar] = useState(false)
  useEffect(() => {
    let last = scrollY
    let raf = 0
    const check = () => {
      raf = 0
      const y = scrollY
      const next = y < 60 ? 'top' : y > last + 4 ? 'hidden' : y < last - 4 ? 'shown' : null
      if (Math.abs(y - last) > 4 || y < 60) last = y
      if (next) setBar((b) => (b === next ? b : next))
      const isFar = y > innerHeight * 2.5
      setFar((f) => (f === isFar ? f : isFar))
    }
    const on = () => (raf ||= requestAnimationFrame(check))
    addEventListener('scroll', on, { passive: true })
    return () => {
      removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [])
  return [bar, far] as const
}

// Focus lens: hovering the menu focuses the nearest link, the others soften
// out of focus, and one square lens glides between them
function useLens(nav: React.RefObject<HTMLElement>, lens: React.RefObject<HTMLSpanElement>) {
  useEffect(() => {
    const n = nav.current!
    const l = lens.current!
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let hot: HTMLElement | null = null
    let shown = false
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const links = [...n.querySelectorAll<HTMLElement>('a')]
      let best: HTMLElement | null = null
      let d = Infinity
      for (const a of links) {
        const r = a.getBoundingClientRect()
        const dd = Math.abs(e.clientX - (r.left + r.width / 2))
        if (dd < d) (d = dd), (best = a)
      }
      if (!best || best === hot) return
      hot?.removeAttribute('data-hot')
      hot = best
      hot.setAttribute('data-hot', '')
      n.setAttribute('data-focus', '')
      const nr = n.getBoundingClientRect()
      const r = hot.getBoundingClientRect()
      const to = { x: r.left - nr.left, y: r.top - nr.top, width: r.width, height: r.height }
      if (!shown || reduced()) {
        gsap.set(l, to)
        gsap.fromTo(l, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.25, ease: 'power3.out' })
        shown = true
      } else gsap.to(l, { ...to, duration: 0.4, ease: 'power3.out', overwrite: true })
    }
    const leave = () => {
      hot?.removeAttribute('data-hot')
      hot = null
      shown = false
      n.removeAttribute('data-focus')
      gsap.to(l, { autoAlpha: 0, duration: 0.22, ease: 'power2.out', overwrite: true })
    }
    n.addEventListener('pointermove', move)
    n.addEventListener('pointerleave', leave)
    return () => {
      n.removeEventListener('pointermove', move)
      n.removeEventListener('pointerleave', leave)
    }
  }, [nav, lens])
}

// The clicks' mute key: a small speaker beside the menu key, on every screen
function SoundKey() {
  const [muted, set] = useState(isMuted)
  useEffect(() => onMuted(set), [])
  return (
    <button
      type="button"
      className="header__sound"
      aria-pressed={muted}
      aria-label={muted ? 'Sound is off. Turn click sounds on' : 'Sound is on. Turn click sounds off'}
      title={muted ? 'Sound off' : 'Sound on'}
      onClick={() => {
        setMuted(!muted)
        if (muted) play('tick')
      }}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M3.5 7.5h3l4-3.5v12l-4-3.5h-3z" fill="currentColor" />
        {muted ? (
          <path d="M13.5 7.5l4.5 5M18 7.5l-4.5 5" stroke="currentColor" strokeWidth="1.6" fill="none" />
        ) : (
          <path d="M13.2 7.2a4 4 0 0 1 0 5.6M15.4 5a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.6" fill="none" />
        )}
      </svg>
    </button>
  )
}

export function Header() {
  const time = useClock()
  const dark = useOverDark()
  const [bar, far] = useBar()
  const nav = useRef<HTMLElement>(null)
  const lens = useRef<HTMLSpanElement>(null)
  const fill = useRef<HTMLSpanElement>(null)
  useLens(nav, lens)

  // How far down the page you are: a hairline of magma across the very top
  useEffect(() => {
    const set = gsap.quickSetter(fill.current, 'scaleX')
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => set(s.progress) })
    return () => st.kill()
  }, [])

  const to = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    if (location.pathname !== '/') {
      go('/')
      setTimeout(() => scrollToId(id), 900)
    } else scrollToId(id)
  }
  return (
    <>
    <span className="progress" aria-hidden="true" data-on={bar !== 'top' || undefined}><span ref={fill} /></span>
    <header className="header" data-dark={dark || undefined} data-bar={bar}>
      <a href="/" className="header__mark" onClick={to('top')} aria-label={`${site.name}, home`}>
        {site.name}
      </a>
      <p className="header__meta">
        <span>{site.location}</span>
        <span className="header__time">{time}</span>
      </p>
      <nav ref={nav} className="header__nav" aria-label="Sections">
        <span ref={lens} className="header__lens" aria-hidden="true" />
        <Magnetic><a href="/#work" onClick={to('work')}><Roll>Work</Roll></a></Magnetic>
        <Magnetic><a href="/#about" onClick={to('about')}><Roll>About</Roll></a></Magnetic>
        <Magnetic><a href="/#experience" onClick={to('experience')}><Roll>Experience</Roll></a></Magnetic>
        <Magnetic><a href="/#contact" onClick={to('contact')}><Roll>Contact</Roll></a></Magnetic>
        <Magnetic><a href="/Perraz-Badhniwalla-CV.pdf" target="_blank" rel="noreferrer"><Roll>CV</Roll></a></Magnetic>
        <SoundKey />
        {/* Phones and tablets: a small square opens the command menu (desktop uses Ctrl/⌘ K) */}
        <button type="button" className="header__find" aria-label="Go anywhere on this site" aria-haspopup="dialog" onClick={() => dispatchEvent(new Event(OPEN_PALETTE))}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <circle cx="8.5" cy="8.5" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.8 12.8 L17.5 17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
          </svg>
        </button>
      </nav>
    </header>
    <button
      type="button"
      className="totop"
      data-on={(bar === 'shown' && far && !dark) || undefined}
      data-dark={dark || undefined}
      tabIndex={bar === 'shown' && far && !dark ? 0 : -1}
      aria-label="Back to top"
      onClick={() => scrollToId('top')}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
    </button>
    </>
  )
}
