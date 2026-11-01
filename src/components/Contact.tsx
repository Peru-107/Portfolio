import { useState } from 'react'
import { site } from '../content'
import { Magnetic } from './Magnetic'
import { scrollToId } from '../lib/motion'

export function Contact() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
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
      <h2 id="contact-title" className="contact__title">Got an idea that <span className="accent">should exist?</span></h2>
      <div className="contact__mail">
        <Magnetic strength={0.18}>
          <a href={`mailto:${site.email}`} className="contact__email" data-cursor="Write">
            {site.email}
          </a>
        </Magnetic>
        <button type="button" className="contact__copy" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy email'}
        </button>
        <a className="contact__copy" href="/Perraz-Badhniwalla-CV.pdf" download>Download CV (PDF)</a>
      </div>
      <ul className="contact__links">
        {site.links.map((l) => (
          <li key={l.label}>
            <Magnetic>
              <a href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
            </Magnetic>
          </li>
        ))}
      </ul>
      <footer className="footer">
        <p>© {new Date().getFullYear()} {site.fullName}</p>
        <p>Designed and built by me with three.js, GSAP and anime.js</p>
        <a href="#top" onClick={(e) => (e.preventDefault(), scrollToId('top'))}>Back to top</a>
      </footer>
    </section>
  )
}
