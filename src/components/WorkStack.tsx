import { useEffect, useRef, useState } from 'react'
import { gsap, reduced } from '../lib/motion'
import { go } from '../lib/router'

// The work itself, in depth: real screens fanned in 3D like folders in a
// drawer. Moving across the stack pulls up the card under that part of it;
// clicking opens it. The whole stack also turns toward the cursor.
const CARDS = [
  { src: '/media/stack-cube.webp', slug: 'cube', title: 'CUBE' },
  { src: '/media/stack-folio.webp', slug: 'folio', title: 'Folio' },
  { src: '/media/stack-tv.webp', slug: 'glass-home', title: 'Glass Home' },
  { src: '/media/stack-nextup.webp', slug: 'nextup', title: 'Nextup' },
  { src: '/media/stack-by.webp', slug: 'byperraz', title: 'byperraz engine' },
]

export function WorkStack({ bare, enter, cycle }: { bare?: boolean; enter?: boolean; cycle?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  const stack = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const hovering = useRef(false)

  // When nobody is pointing at it, the stack flips through its folders on its own
  useEffect(() => {
    if (!cycle || reduced()) return
    let i = -1
    const id = setInterval(() => {
      if (hovering.current) return
      i = (i + 1) % CARDS.length
      setActive(i)
    }, 1800)
    return () => clearInterval(id)
  }, [cycle])

  useEffect(() => {
    const el = root.current!
    gsap.set(stack.current, { rotationX: 12, rotationY: -22 })
    if (reduced()) return
    const rx = gsap.quickTo(stack.current, 'rotationX', { duration: 1.2, ease: 'power3' })
    const ry = gsap.quickTo(stack.current, 'rotationY', { duration: 1.2, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const nx = Math.max(-0.5, Math.min(0.5, (e.clientX - r.left) / r.width - 0.5))
      const ny = Math.max(-0.5, Math.min(0.5, (e.clientY - r.top) / r.height - 0.5))
      ry(-22 + nx * 20)
      rx(12 - ny * 14)
    }
    addEventListener('pointermove', move, { passive: true })
    return () => removeEventListener('pointermove', move)
  }, [])

  // Which card the pointer is over, by its slot across the stack rather than
  // by hit-testing, so the cards at the back are as easy to reach as the front
  const pick = (e: React.PointerEvent) => {
    // Like reaching for a folder by its tab: the furthest-back card whose
    // left edge is already behind the pointer
    const cards = root.current!.querySelectorAll<HTMLElement>('.ws__card')
    let i = 0
    cards.forEach((c, k) => {
      if (c.getBoundingClientRect().left <= e.clientX) i = k
    })
    setActive(i)
  }

  useEffect(() => {
    if (!enter || reduced()) return
    // Animate the image inside each card, so the card keeps its depth and hover styles
    const tw = gsap.from(root.current!.querySelectorAll('.ws__card img'), { autoAlpha: 0, yPercent: 30, scale: 0.9, stagger: 0.09, duration: 1.1, ease: 'expo.out', delay: 0.6 })
    return () => {
      tw.revert()
    }
  }, [enter])

  const current = active === null ? null : CARDS[active]!

  return (
    <div ref={root} className="ws" data-bare={bare || undefined}>
      <div
        className="ws__hit"
        onPointerMove={(e) => ((hovering.current = true), pick(e))}
        onPointerLeave={() => ((hovering.current = false), setActive(null))}
        onClick={() => current && go(`/work/${current.slug}`)}
        data-cursor={current ? 'Open' : undefined}
        aria-hidden="true"
      />
      <div ref={stack} className="ws__stack">
        {CARDS.map((c, i) => (
          <a
            key={c.slug}
            className="ws__card"
            href={`/work/${c.slug}`}
            onClick={(e) => (e.preventDefault(), go(`/work/${c.slug}`))}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            data-active={active === i || undefined}
            style={{ ['--i' as string]: i }}
            aria-label={`${c.title} case study`}
          >
            <img src={c.src} alt="" />
          </a>
        ))}
      </div>
      <p className="ws__label" data-on={current ? '' : undefined} aria-hidden="true">{current?.title ?? ''}</p>
    </div>
  )
}
