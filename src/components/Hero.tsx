import { useEffect, useRef, useState } from 'react'
import { InkP } from '../hero/InkP'
import { site } from '../content'
import { gsap, scrollToId } from '../lib/motion'

// The first screen is only my name in live ink. Below it, what I do: the
// headline rises line by line as it comes into view. Plain scrolling, no pins.
export function Hero({ ready }: { ready: boolean }) {
  const pitch = useRef<HTMLElement>(null)
  const mark = useRef<HTMLDivElement>(null)
  // A one-line hint, shown only if nobody has found the trick after a few seconds
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    const touch = matchMedia('(hover: none)').matches
    let found = false
    const onPlay = () => {
      found = true
      setHint(null)
    }
    window.addEventListener('ink:played', onPlay)
    const t = window.setTimeout(() => {
      if (!found && scrollY < 40) setHint(touch ? 'Tilt your phone.' : 'Type something.')
    }, 4500)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('ink:played', onPlay)
    }
  }, [ready])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.from('.pitch__line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1, scrollTrigger: { trigger: '.pitch__title', start: 'top 82%' } })
      gsap.from('.pitch__meta > *', { autoAlpha: 0, y: 18, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.pitch__meta', start: 'top 92%' } })
    }, pitch)
    return () => ctx.revert()
  }, [])

  const lines = ['I design products,', 'build them myself,', 'and know their worth.']

  return (
    <>
      <section id="top" className="hero">
        {/* The ink fills the whole screen; only the word's shape inside it moves */}
        <InkP play={ready} text={site.name} layout="wordmark" anchor={mark} track />
        <div className="hero__stage">
          <div ref={mark} className="hero__mark" aria-hidden="true" />
        </div>
        <h1 className="sr-only">{site.fullName}</h1>
        <p className="hero__hint" data-on={hint ? '' : undefined} aria-hidden="true">{hint}</p>
      </section>

      <section ref={pitch} className="pitch" aria-label="What I do">
        <div className="pitch__copy">
          <p className="pitch__title" aria-label={site.pitch}>
            {lines.map((l) => (
              <span key={l} className="pitch__line" aria-hidden="true"><span>{l}</span></span>
            ))}
          </p>
        </div>
        <div className="pitch__meta">
          <p className="pitch__status"><i aria-hidden="true" />{site.status}</p>
          <a href="#work" className="pitch__link" onClick={(e) => (e.preventDefault(), scrollToId('work'))}>See what I’ve built</a>
        </div>
      </section>
    </>
  )
}
