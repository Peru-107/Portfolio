import { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import { site } from '../content'
import { gsap, reduced } from '../lib/motion'

function Letters({ text, className }: { text: string; className: string }) {
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <span key={w} className="mf__word" aria-hidden="true">
          {word.split('').map((c, i) => (
            <span key={i} className="mf__ch">{c}</span>
          ))}
        </span>
      ))}
    </span>
  )
}

// The idea, then the follow-through. Letters of the first line flick away
// from the pointer like drops off a nib (anime.js); scrolling inks in the
// second line letter by letter (GSAP, scrubbed).
export function Manifesto() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current!
    const first = Array.from(el.querySelectorAll<HTMLElement>('.mf__a .mf__ch'))
    const second = Array.from(el.querySelectorAll<HTMLElement>('.mf__b .mf__ch'))
    if (reduced()) return

    const io = new IntersectionObserver(([e]) => {
      if (!e!.isIntersecting) return
      io.disconnect()
      animate(first, { translateY: ['0.9em', '0em'], opacity: [0, 1], rotate: [8, 0], duration: 900, delay: stagger(28), ease: 'outExpo' })
    }, { threshold: 0.4 })
    io.observe(el)

    const busy = new WeakSet<HTMLElement>()
    const flick = (ch: HTMLElement, e: PointerEvent) => {
      if (busy.has(ch)) return
      busy.add(ch)
      const r = ch.getBoundingClientRect()
      const dir = e.clientX < r.left + r.width / 2 ? 1 : -1
      animate(ch, {
        translateY: [{ to: '-0.32em', duration: 160, ease: 'outQuad' }, { to: '0em', duration: 900, ease: 'outElastic(1, .4)' }],
        rotate: [{ to: dir * 14, duration: 160, ease: 'outQuad' }, { to: 0, duration: 900, ease: 'outElastic(1, .4)' }],
        color: [{ to: '#ff6a1a', duration: 120 }, { to: '#e9ecef', duration: 1100, ease: 'inQuad' }],
        onComplete: () => busy.delete(ch),
      })
    }
    const handlers = first.map((ch) => {
      const h = (e: PointerEvent) => flick(ch, e)
      ch.addEventListener('pointerenter', h)
      return h
    })

    const ctx = gsap.context(() => {
      gsap.fromTo(second, { color: 'rgba(233,236,239,0.12)' }, {
        color: '#ff6a1a',
        stagger: 0.06,
        ease: 'none',
        scrollTrigger: { trigger: '.mf__b', start: 'top 85%', end: 'top 35%', scrub: 0.6 },
      })
    }, el)

    return () => {
      io.disconnect()
      first.forEach((ch, i) => ch.removeEventListener('pointerenter', handlers[i]!))
      ctx.revert()
    }
  }, [])

  return (
    <section ref={root} className="mf" aria-label="Approach">
      <p className="mf__lines">
        <Letters text={site.manifesto[0]!} className="mf__a" />
        <Letters text={site.manifesto[1]!} className="mf__b" />
      </p>
      <p className="mf__note">Ideas are cheap when they stay in a file. I take mine all the way to the browser, where people actually touch them.</p>
    </section>
  )
}
