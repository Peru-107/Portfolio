import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Cursor } from './components/Cursor'
import { Preloader } from './components/Preloader'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Interlude } from './components/Interlude'
import { Work } from './components/Work'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Contact } from './components/Contact'
import { SideNav } from './components/SideNav'
import { setTransition, usePath } from './lib/router'
import { useReveals } from './lib/reveal'
import { gsap, reduced, scrollTop, scrollToY, ScrollTrigger, startScroll } from './lib/motion'
import { site } from './content'
import { startSound } from './lib/sound'

const Case = lazy(() => import('./components/Case').then((m) => ({ default: m.Case })))

export default function App() {
  const path = usePath()
  const [ready, setReady] = useState(false)
  const wipe = useRef<HTMLDivElement>(null)
  const onDone = useCallback(() => setReady(true), [])
  useReveals(path)

  useEffect(() => {
    startScroll()
    startSound()
    const expand = (from: HTMLElement, swap: () => void) => {
      const media = [...from.querySelectorAll<HTMLElement>('.chapter__media')].find((m) => m.offsetParent !== null) ?? from
      const r = media.getBoundingClientRect()
      const sheet = document.createElement('div')
      sheet.className = 'expand'
      const clone = media.cloneNode(true) as HTMLElement
      clone.querySelectorAll('video').forEach((v) => {
        const img = document.createElement('img')
        img.src = v.poster
        img.className = v.className
        v.replaceWith(img)
      })
      sheet.appendChild(clone)
      const clip = (t: { left: number; top: number; right: number; bottom: number }) =>
        `inset(${t.top}px ${innerWidth - t.right}px ${innerHeight - t.bottom}px ${t.left}px)`
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
          const until = performance.now() + 2000
          const land = () => {
            const stage = document.querySelector<HTMLElement>('.case__stage')
            if (!stage) return performance.now() < until ? requestAnimationFrame(land) : done()
            const box = stage.getBoundingClientRect()
            if (box.top > innerHeight * 0.7) return done()
            gsap.to(sheet, {
              clipPath: clip({ left: box.left, top: box.top, right: box.right, bottom: Math.min(box.bottom, innerHeight) }),
              duration: 0.45,
              ease: 'expo.out',
              onComplete: done,
            })
          }
          requestAnimationFrame(land)
        },
      })
    }

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
    document.fonts.ready.then(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [path])

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
  const unknown = !slug && path !== '/'

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Preloader onDone={onDone} />
      <Cursor />
      <Header />
      <div id="main">
        <Suspense fallback={null}>
          {slug || unknown ? (
            <Case key={slug ?? path} slug={slug ?? ''} />
          ) : (
            <main>
              <div className="pin-wrap">
                <Hero ready={ready} />
              </div>
              <Interlude />
              <Work />
              <About />
              <Experience />
              <Contact />
              <SideNav />
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
