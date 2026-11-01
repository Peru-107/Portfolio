import { useCallback, useEffect, useRef, useState } from 'react'
import { Cursor } from './components/Cursor'
import { Preloader } from './components/Preloader'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { WorkIndex } from './components/WorkIndex'
import { Work } from './components/Work'
import { About } from './components/About'
import { Experience } from './components/Experience'
import { Contact } from './components/Contact'
import { Case } from './components/Case'
import { setTransition, usePath } from './lib/router'
import { gsap, reduced, scrollTop, ScrollTrigger, startScroll } from './lib/motion'
import { site } from './content'

export default function App() {
  const path = usePath()
  const [ready, setReady] = useState(false)
  const wipe = useRef<HTMLDivElement>(null)
  const onDone = useCallback(() => setReady(true), [])

  useEffect(() => {
    startScroll()
    // Between pages a sheet of ink rises over the screen and leaves upward
    setTransition((swap) => {
      if (reduced()) {
        swap()
        scrollTop()
        return
      }
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
        {slug ? (
          <Case key={slug} slug={slug} />
        ) : (
          <main>
            <Hero ready={ready} />
            <WorkIndex />
            <Work />
            <About />
            <Experience />
            <Contact />
          </main>
        )}
      </div>
      <div ref={wipe} className="wipe" aria-hidden="true">
        <span>{site.name}</span>
      </div>
    </>
  )
}
