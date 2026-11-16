import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)
// Phone address bars resize the viewport while you scroll; re-measuring then makes pins jump
ScrollTrigger.config({ ignoreMobileResize: true })

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null
let normal: { enable(): void; disable(): void } | null = null

// Lenis driven from GSAP's ticker, so ScrollTrigger never reads a stale scroll
// iPhone and iPad (which reports itself as a Mac with a touch screen)
const iOS = typeof navigator !== 'undefined' && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

export function startScroll() {
  // Safari runs its momentum scroll apart from the page's scripts, so pinned
  // sections lag a frame and shudder. Here the scroll is driven on the same
  // thread as the animation instead, which keeps pins and scroll locked
  // together. Lenis stays off on these devices: the two would fight.
  if (iOS) {
    if (!reduced()) normal = ScrollTrigger.normalizeScroll({ allowNestedScroll: true, type: 'touch' }) || null
    return
  }
  if (lenis || reduced()) return
  // A steady lerp rather than a fixed duration: every wheel step, large or small, glides the same way
  // Slightly softer lerp = Neo-Tokyo luxury glide without feeling sluggish
  lenis = new Lenis({ lerp: 0.072, smoothWheel: true, wheelMultiplier: 0.88 })
  lenis.on('scroll', ScrollTrigger.update)
  // First on the clock, ahead of anything added earlier (the hero's ink is set
  // up before this runs): each frame the scroll moves, the scroll animations
  // place everything, and only then does anything read positions or draw
  gsap.ticker.add((t) => lenis?.raf(t * 1000), false, true)
  gsap.ticker.lagSmoothing(0)
}

export function scrollTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
}

export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else window.scrollTo(0, y)
}

export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.4 })
  else el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' })
}

export function lockScroll(on: boolean) {
  if (on) (lenis?.stop(), normal?.disable())
  else (lenis?.start(), normal?.enable())
  document.documentElement.style.overflow = on ? 'hidden' : ''
}

export { gsap, ScrollTrigger }
