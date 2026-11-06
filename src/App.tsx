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
import { gsap, reduced, scrollTop, scrollToY, ScrollTrigger, startScroll } from './lib/motion'
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
      // A full-screen sheet holding the card's image, opened through a clip: only
      // the clip animates, so the browser never has to lay anything out mid-flight
      const sheet = document.createElement('div')
      sheet.className = 'expand'
      const clone = media.cloneNode(true) as HTMLElement
      // A still in place of any video: nothing to decode during the move
      clone.querySelectorAll('video').forEach((v) => {
        const img = document.createElement('img')
        img.src = v.poster
        img.className = v.className
        v.replaceWith(img)
      })
      sheet.appendChild(clone)
      const clip = (t: { left: number; top: number; right: number; bottom: number }) => `inset(${t.top}px ${innerWidth - t.right}px ${innerHeight - t.bottom}px ${t.left}px)`
      sheet.style.clipPath = clip(r)
      document.body.appendChild(sheet)
      const done = () => void gsap.to(sheet, { autoAlpha: 0, duration: 0.25, ease: 'power2.out', onComplete: () => sheet.remove() })
      gsap.to(sheet, {
        clipPath: 'inset(0px 0px 0px 0px)',
        duration: 0.5,
        ease: 'expo.inOut',
        onComplete: () => {
          swap()
          scrollTop()
          // The case study arrives a moment later (it loads on demand); then settle onto its image
          const until = performance.now() + 2000
          const land = () => {
            const stage = document.querySelector<HTMLElement>('.case__stage')
            if (!stage) return performance.now() < until ? requestAnimationFrame(land) : done()
            const r = stage.getBoundingClientRect()
            // The cover waits further down the page: settle onto its visible part, or just fade
            if (r.top > innerHeight * 0.7) return done()
            gsap.to(sheet, { clipPath: clip({ left: r.left, top: r.top, right: r.right, bottom: Math.min(r.bottom, innerHeight) }), duration: 0.45, ease: 'expo.out', onComplete: done })
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
        .to(wipe.current, { yPercent: 0, duration: 0.45, ease: 'expo.in' })
        .add(() => {
          swap()
          scrollTop()
        })
        .to(wipe.current, { yPercent: -100, duration: 0.55, ease: 'expo.out', delay: 0.05 })
        .set(wipe.current, { autoAlpha: 0 })
    })
  }, [])

  // After a page change, keyboard and screen-reader focus starts at the new page's title
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    const id = window.setTimeout(() => {
      const h = document.querySelector<HTMLElement>('#main h1')
      if (!h) return
      h.tabIndex = -1
      h.focus({ preventScroll: true })
    }, 120)
    return () => window.clearTimeout(id)
  }, [path])

  useEffect(() => {
    if (path === '/') document.title = `${site.fullName}: design and front-end`
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    // Positions depend on the display face: measure again once it has loaded
    document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [path])

  // Going back lands where that page was left (the same card in the work deck).
  // The site restores the position itself, after the pinned sections are measured
  useEffect(() => {
    history.scrollRestoration = 'manual'
    let id = 0
    const on = () => {
      const y = history.state?.y
      if (typeof y !== 'number') return
      window.clearTimeout(id)
      id = window.setTimeout(() => {
        ScrollTrigger.refresh()
        scrollToY(y)
      }, 120)
    }
    addEventListener('popstate', on)
    return () => {
      removeEventListener('popstate', on)
      window.clearTimeout(id)
    }
  }, [])

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
