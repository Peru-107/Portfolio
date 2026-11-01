import { useEffect } from 'react'
import { reduced } from './motion'

// One quiet reveal system for everything after the hero. Mark an element with
// data-reveal and it plays once as it scrolls into view; the look of each kind
// lives in CSS:
//   rise   heading lines come up from behind a mask
//   line   a hairline draws across the top
//   unveil an image opens from a clean edge
//   fade   text settles up into place
//   count  numbers roll like a mechanical counter (see Count)
// The browser does the watching, so it costs nothing while scrolling.
export function useReveals(key: string) {
  useEffect(() => {
    const els = () => document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-in])')
    if (reduced()) {
      els().forEach((el) => el.setAttribute('data-in', ''))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          e.target.setAttribute('data-in', '')
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    // New elements appear when a page or a lazy section renders
    const watch = () => els().forEach((el) => io.observe(el))
    watch()
    const mo = new MutationObserver(watch)
    mo.observe(document.getElementById('main') ?? document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [key])
}
