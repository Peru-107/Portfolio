import { useEffect, useMemo, useRef, useState } from 'react'
import { projects, site } from '../content'
import { go } from '../lib/router'
import { lockScroll, scrollToId } from '../lib/motion'
import { tick } from '../lib/haptic'

// A command menu, the kind product tools have: Ctrl or ⌘ and K opens it from
// anywhere, typing narrows it, arrows and Enter choose. Every page, project
// and contact route on the site is one line away.

// run() may report back: false means it didn't work (the email wasn't copied)
type Item = { group: string; label: string; hint?: string; run: () => void | Promise<boolean> }

const toSection = (id: string) => () => {
  if (location.pathname !== '/') {
    go('/')
    setTimeout(() => scrollToId(id), 900)
  } else scrollToId(id)
}

export const OPEN_PALETTE = 'palette:open'

export function Palette() {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [q, setQ] = useState('')
  const [at, setAt] = useState(0)
  const [note, setNote] = useState('')

  const items = useMemo<Item[]>(
    () => [
      ...projects.map((p) => ({ group: 'Work', label: p.title, hint: p.kind, run: () => go(`/work/${p.slug}`) })),
      { group: 'Go to', label: 'Work', run: toSection('work') },
      { group: 'Go to', label: 'About', run: toSection('about') },
      { group: 'Go to', label: 'Experience', run: toSection('experience') },
      { group: 'Go to', label: 'Contact', run: toSection('contact') },
      {
        group: 'Reach me',
        label: 'Copy email',
        hint: site.email,
        run: () =>
          navigator.clipboard.writeText(site.email).then(
            () => true,
            () => {
              // No clipboard (an insecure page, a refused permission): open the mail app instead
              location.href = `mailto:${site.email}`
              return false
            },
          ),
      },
      { group: 'Reach me', label: 'Download CV', hint: 'PDF', run: () => void window.open('/Perraz-Badhniwalla-CV.pdf', '_blank', 'noopener') },
      ...site.links.map((l) => ({ group: 'Reach me', label: l.label, hint: l.href.replace(/^https?:\/\/(www\.)?/, ''), run: () => void window.open(l.href, '_blank', 'noopener') })),
    ],
    [],
  )
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    return items.filter((it) => words.every((w) => `${it.group} ${it.label} ${it.hint ?? ''}`.toLowerCase().includes(w)))
  }, [q, items])

  const close = () => dialog.current?.close()
  const open = () => {
    const d = dialog.current
    if (!d || d.open) return
    setQ('')
    setAt(0)
    d.showModal()
    lockScroll(true)
    input.current?.focus()
  }

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (dialog.current?.open) close()
        else open()
      }
    }
    addEventListener('keydown', key)
    addEventListener(OPEN_PALETTE, open)
    return () => {
      removeEventListener('keydown', key)
      removeEventListener(OPEN_PALETTE, open)
    }
  }, [])

  // The chosen line stays in view while arrowing through the list
  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [at, shown])

  const choose = (it: Item | undefined) => {
    if (!it) return
    tick()
    close()
    const done = it.run()
    // Announce a copy only once the clipboard has really taken it
    if (done instanceof Promise)
      void done.then((ok) => {
        if (!ok) return
        setNote('Email address copied')
        setTimeout(() => setNote(''), 1800)
      })
  }

  let group = ''
  return (
    <>
      <dialog
        ref={dialog}
        className="palette"
        aria-label="Go anywhere on this site"
        onClose={() => lockScroll(false)}
        onClick={(e) => e.target === dialog.current && close()}
      >
        <div className="palette__box">
          <input
            ref={input}
            className="palette__input"
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={shown[at] ? `palette-${at}` : undefined}
            aria-label="Search pages, projects and links"
            placeholder="Where to?"
            autoComplete="off"
            spellCheck={false}
            value={q}
            onChange={(e) => (setQ(e.target.value), setAt(0))}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') (e.preventDefault(), setAt((i) => Math.min(shown.length - 1, i + 1)))
              else if (e.key === 'ArrowUp') (e.preventDefault(), setAt((i) => Math.max(0, i - 1)))
              else if (e.key === 'Enter') (e.preventDefault(), choose(shown[at]))
            }}
          />
          <ul ref={list} id="palette-list" className="palette__list" role="listbox" aria-label="Results" data-lenis-prevent>
            {shown.map((it, i) => {
              const head = it.group !== group ? (group = it.group) : null
              return (
                <li key={`${it.group}-${it.label}`} role="presentation">
                  {head && <p className="palette__group" aria-hidden="true">{head}</p>}
                  <div
                    id={`palette-${i}`}
                    role="option"
                    aria-selected={i === at}
                    className="palette__item"
                    onPointerMove={() => i !== at && setAt(i)}
                    onClick={() => choose(it)}
                  >
                    <span>{it.label}</span>
                    {it.hint && <small>{it.hint}</small>}
                  </div>
                </li>
              )
            })}
            {!shown.length && <li className="palette__none">Nothing by that name. Try “work” or “email”.</li>}
          </ul>
          <p className="palette__keys" aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
            <span><kbd>Enter</kbd> open</span>
            <span><kbd>Esc</kbd> close</span>
          </p>
        </div>
      </dialog>
      <span role="status" className="sr-only">{note}</span>
    </>
  )
}
