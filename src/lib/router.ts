import { useEffect, useState } from 'react'

// A tiny history router: the site has two kinds of page, so a library would
// be most of the bundle. `go` runs the registered transition around the swap.

// `from` is the element that was opened (a project card), when the page should grow out of it
type Transition = (swap: () => void, from?: HTMLElement) => void
let transition: Transition = (swap) => swap()
const EVT = 'app:navigate'

export function setTransition(t: Transition) {
  transition = t
}

export function go(to: string, from?: HTMLElement) {
  if (to === location.pathname) return
  transition(() => {
    // The page being left remembers where it was, so coming back lands in the same place
    history.replaceState({ ...history.state, y: scrollY }, '')
    history.pushState({ app: true }, '', to)
    dispatchEvent(new Event(EVT))
  }, from)
}

/** Back to where you came from on this site (the same spot in the work deck);
 *  a visitor who arrived straight on this page goes to `fallback` instead */
export function back(fallback = '/') {
  if (history.state?.app) transition(() => history.back())
  else go(fallback)
}

export function usePath() {
  const [path, setPath] = useState(location.pathname)
  useEffect(() => {
    const on = () => setPath(location.pathname)
    addEventListener('popstate', on)
    addEventListener(EVT, on)
    return () => {
      removeEventListener('popstate', on)
      removeEventListener(EVT, on)
    }
  }, [])
  return path
}

export function linkProps(to: string, expand = false) {
  return {
    href: to,
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      go(to, expand ? (e.currentTarget as HTMLElement) : undefined)
    },
  }
}
