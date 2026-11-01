import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Cursor } from './components/Cursor'
import { Preloader } from './components/Preloader'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Work } from './components/Work'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Contact } from './components/Contact'
import { setTransition, usePath } from './lib/router'
import { useReveals } from './lib/reveal'
import { gsap, reduced, scrollTop, ScrollTrigger, startScroll } from './lib/motion'
import { site } from './content'

// Case studies and the lab load only when visited, so the first screen downloads less
const Case = lazy(() => import('./components/Case').then((m) => ({ default: m.Case })))
const InkStory = lazy(() => import('./lab/InkStory').then((m) => ({ default: m.InkStory })))

export default function App() {
  const path = usePath()
  const [ready, setReady] = useState(false)
  const wipe = useRef<HTMLDivElement>(null)
  const onDone = useCallback(() => setReady(true), [])
  useReveals(path)

  useEffect(() => {
    startScroll()
    // Opening a project: the card grows to fill the screen, the case study loads
    // beneath it, and the card settles into the page's header image
    const expand = (from: HTMLElement, swap: () => void) => {
      const media = [...from.querySelectorAll<HTMLElement>('.w2__media')].find((m) => m.offsetParent !== null) ?? from
      const r = media.getBoundingClientRect()
      const sheet = document.createElement('div')
      sheet.className = 'expand'
      sheet.appendChild(media.cloneNode(true))
      Object.assign(sheet.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
      document.body.appendChild(sheet)
      const done = () => void gsap.to(sheet, { autoAlpha: 0, duration: 0.25, ease: 'power2.out', onComplete: () => sheet.remove() })
      gsap.to(sheet, {
        left: 0,
        top: 0,
        width: innerWidth,
        height: innerHeight,
        duration: 0.55,
        ease: 'expo.inOut',
        onComplete: () => {
          swap()
          scrollTop()
          // The case study arrives a moment later (it loads on demand); then settle onto its image
          const until = performance.now() + 2000
          const land = () => {
            const stage = document.querySelector<HTMLElement>('.case__stage')
            if (!stage) return performance.now() < until ? requestAnimationFrame(land) : done()
            const t = stage.getBoundingClientRect()
            gsap.to(sheet, { left: t.left, top: t.top, width: t.width, height: t.height, duration: 0.5, ease: 'expo.out', onComplete: done })
          }
          requestAnimationFrame(land)
        },
      })
    }

    // Between other pages a sheet of ink rises over the screen and leaves upward
    setTransition((swap, from) => {
      if (reduced()) {
        swap()
        scrollTop()
        return
      }
      if (from) return expand(from, swap)
      gsap
        .timeline()
        .set(wipe.current, { yPercent: 100, autoAlpha: 1 })
        .to(wipe.current, { yPercent: 0, duration: 0.6, ease: 'expo.in' })
        .add(() => {
          swap()
          scrollTop()
        })
        .to(wipe.current, { yPercent: -100, duration: 0.8, ease: 'expo.out', delay: 0.15 })
        .set(wipe.current, { autoAlpha: 0 })
    })
  }, [])

  useEffect(() => {
    if (path === '/') document.title = `${site.fullName}: design and front-end`
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [path])

  const slug = path.startsWith('/work/') ? path.slice(6).replace(/\/$/, '') : null

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Preloader onDone={onDone} />
      <Cursor />
      <Header />
      <div id="main">
        <Suspense fallback={null}>
        {path.replace(/\/$/, '') === '/ink-story' ? (
          <InkStory />
        ) : slug ? (
          <Case key={slug} slug={slug} />
        ) : (
          <main>
            {/* Pinned sections sit in their own wrappers: GSAP's pin spacer then never disturbs React's siblings */}
            <div className="pin-wrap"><Hero ready={ready} /></div>
            <div className="pin-wrap"><Work /></div>
            <About />
            <Experience />
            <Contact />
          </main>
        )}
        </Suspense>
      </div>
      <div ref={wipe} className="wipe" aria-hidden="true">
        <span>{site.name}</span>
      </div>
    </>
  )
}
