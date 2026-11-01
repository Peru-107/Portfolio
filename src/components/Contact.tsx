import { useLayoutEffect, useRef, useState } from 'react'
import { site } from '../content'
import { Magnetic } from './Magnetic'
import { scrollToId } from '../lib/motion'
import { tick } from '../lib/haptic'

// The closing chapter, on ink: one question, then the email address set as
// large as the page allows. Its letters ink in magma when you point at it (on
// phones, as it arrives). Everything else is a quiet row of links.
export function Contact() {
  const [copied, setCopied] = useState(false)
  const mail = useRef<HTMLAnchorElement>(null)
  const [user, domain] = site.email.split('@') as [string, string]

  // Size the address to fill the measure exactly: one line on wide screens,
  // name above domain on narrow ones
  useLayoutEffect(() => {
    const a = mail.current!
    const fit = () => {
      a.style.fontSize = '100px'
      // The link shrinks to its text, so its width is the widest line in either layout
      const widest = a.getBoundingClientRect().width
      const room = a.parentElement!.clientWidth
      a.style.fontSize = `${Math.floor((100 * room) / widest) - 1}px`
    }
    fit()
    document.fonts.ready.then(fit)
    const ro = new ResizeObserver(fit)
    ro.observe(a.parentElement!)
    return () => ro.disconnect()
  }, [])

  const copy = async () => {
    tick()
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      location.href = `mailto:${site.email}`
    }
  }

  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <h2 id="contact-title" className="contact__title" data-reveal="rise"><span>Got an idea that <span className="accent">should exist?</span></span></h2>
      <div className="contact__mail" data-reveal="fade">
        <a ref={mail} href={`mailto:${site.email}`} className="contact__email" data-cursor="Write" aria-label={`Email ${site.email}`}>
          <span className="contact__line" aria-hidden="true">{user}</span>
          <span className="contact__line" aria-hidden="true">@{domain}</span>
        </a>
      </div>
      <ul className="contact__links" data-reveal="fade">
        <li>
          <button type="button" className="u" onClick={copy} aria-live="polite">{copied ? 'Copied' : 'Copy email'}</button>
        </li>
        <li>
          <a className="u" href="/Perraz-Badhniwalla-CV.pdf" download onClick={() => tick()}>Download CV</a>
        </li>
        {site.links.map((l) => (
          <li key={l.label}>
            <Magnetic>
              <a className="u" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
            </Magnetic>
          </li>
        ))}
      </ul>
      <footer className="footer" data-reveal="line">
        <p>© {new Date().getFullYear()} {site.fullName}</p>
        <p>Designed and built by me with WebGL, GSAP and Lenis</p>
        <a className="u" href="#top" onClick={(e) => (e.preventDefault(), scrollToId('top'))}>Back to top</a>
      </footer>
    </section>
  )
}
