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
    history.pushState({}, '', to)
    dispatchEvent(new Event(EVT))
  }, from)
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
