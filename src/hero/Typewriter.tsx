import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { tick } from '../lib/haptic'
// The card designs load on first print, not with the page
const designs = ['Bloom', 'Night', 'Proof']
const print = (text: string, name: string, design: number) => import('./postcard').then((m) => m.postcard(text, name, design))
const preview = (text: string, name: string) => import('./postcard').then((m) => m.previews(text, name))

// Write in ink: type on the first screen and your words are struck onto the
// paper under my name, letter by letter, each one a little uneven like real
// type. Backspace lifts a letter off in a puff, Enter starts a new line.
// "Print it" saves your words as a printed card (see postcard.ts).

const MAX_LINES = 3
const MAX_PER_LINE = 34
const CV = '/Perraz-Badhniwalla-CV.pdf'

// Each position always gets the same small imperfection, so a letter never jumps
function jitter(i: number) {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return { rot: (r(1) - 0.5) * 3.2, y: (r(2) - 0.5) * 3, ink: 0.78 + r(3) * 0.22 }
}

function fits(text: string) {
  const lines = text.split('\n')
  return lines.length <= MAX_LINES && lines.every((l) => l.length <= MAX_PER_LINE)
}

// Break long words onto a new line automatically, as a typewriter's bell would
function add(text: string, ch: string) {
  const next = text + ch
  if (fits(next)) return next
  if (ch !== '\n' && text.split('\n').length < MAX_LINES) {
    const wrapped = text + '\n' + (ch === ' ' ? '' : ch)
    if (fits(wrapped)) return wrapped
  }
  return text
}

export function Typewriter({ onWrite, invite }: { onWrite?: () => void; invite?: boolean }) {
  const [text, setText] = useState('')
  const [printing, setPrinting] = useState(false)
  const [name, setName] = useState('')
  const [design, setDesign] = useState(0)
  // A small preview of each design with your words on it, redrawn once you pause
  const [thumbs, setThumbs] = useState<string[]>([])
  const box = useRef<HTMLDivElement>(null)
  const self = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  const prev = useRef('')
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const hired = useRef(false)
  const touch = typeof window !== 'undefined' && matchMedia('(hover: none)').matches

  // Desktop: type anywhere while the first screen is in view
  useEffect(() => {
    if (touch) return
    const key = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest('input, textarea, select, [contenteditable]')) return
      if (scrollY > innerHeight * 0.4) return
      if (e.key === 'Backspace') setText((s) => s.slice(0, -1))
      else if (e.key === 'Enter') setText((s) => add(s, '\n'))
      else if (e.key.length === 1) setText((s) => add(s, e.key))
      else return
      // Space would otherwise scroll the page away mid-sentence
      e.preventDefault()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [touch])

  // Each strike or lift lands in the ink exactly where the letter is
  useLayoutEffect(() => {
    const before = prev.current
    prev.current = text
    if (text === before) return
    onWrite?.()
    const chars = box.current?.querySelectorAll<HTMLElement>('.tw__ch')
    if (text.length > before.length && chars?.length) {
      const r = chars[chars.length - 1]!.getBoundingClientRect()
      const at = { x: r.left + r.width / 2, y: r.top + r.height * 0.6 }
      lastPos.current = at
      window.dispatchEvent(new CustomEvent('ink:drop', { detail: at }))
      // A light tick per letter struck, like a key landing
      tick(5)
    } else if (text.length < before.length && lastPos.current) {
      window.dispatchEvent(new CustomEvent('ink:drop', { detail: { ...lastPos.current, puff: true } }))
      const r = chars?.length ? chars[chars.length - 1]!.getBoundingClientRect() : null
      lastPos.current = r ? { x: r.left + r.width / 2, y: r.top + r.height * 0.6 } : null
    }
    // A small secret: writing "hire" opens the CV
    if (!hired.current && /hire\s*$/i.test(text)) {
      hired.current = true
      window.open(CV, '_blank', 'noopener')
    }
  }, [text, onWrite])

  useEffect(() => {
    if (!text.trim()) return
    let live = true
    const t = window.setTimeout(() => preview(text, name).then((p) => live && setThumbs(p)), 450)
    return () => {
      live = false
      window.clearTimeout(t)
    }
  }, [text, name])

  // When the words and buttons would run off the bottom of a short screen, the
  // name (and its ink, which follows it) glides up just enough to make room
  useLayoutEffect(() => {
    const tw = self.current
    const hero = tw?.closest<HTMLElement>('.hero')
    const mark = hero?.querySelector<HTMLElement>('.hero__mark')
    if (!tw || !hero || !mark) return
    const fit = () => {
      if (!text) return hero.style.setProperty('--lift', '0px')
      const top = hero.getBoundingClientRect().top
      const bottom = top + tw.offsetTop + tw.offsetHeight
      const header = document.querySelector('.header')?.getBoundingClientRect().bottom ?? 70
      const room = top + mark.offsetTop - header - 16
      const lift = Math.max(0, Math.min(bottom - (innerHeight - 20), room))
      hero.style.setProperty('--lift', `${Math.round(lift)}px`)
    }
    fit()
    addEventListener('resize', fit)
    return () => removeEventListener('resize', fit)
  }, [text, thumbs])

  const lines = text.split('\n')
  // The same numbering as the postcard: one step per letter, one more per line break
  const starts = lines.reduce<number[]>((acc, _l, i) => [...acc, i === 0 ? 0 : acc[i - 1]! + lines[i - 1]!.length + 1], [])

  return (
    <div ref={self} className="tw" data-filled={text ? '' : undefined}>
      <div ref={box} className="tw__paper" aria-live="polite" aria-label={text ? `You wrote: ${text}` : undefined}>
        {lines.map((line, li) => (
          <p key={li} className="tw__line">
            {[...line].map((ch, ci) => {
              const i = starts[li]! + ci
              const j = jitter(i)
              return (
                <span key={i} className="tw__ch" style={{ transform: `translateY(${j.y}px) rotate(${j.rot}deg)`, opacity: j.ink }}>
                  {ch === ' ' ? ' ' : ch}
                </span>
              )
            })}
            {li === lines.length - 1 && text && <span className="tw__caret" aria-hidden="true" />}
          </p>
        ))}
      </div>

      {touch && (
        <>
          {/* Not there at first: it fades in after a few seconds as the invitation */}
          <button type="button" className="tw__write" onClick={() => field.current?.focus()} data-on={invite && !text ? '' : undefined} tabIndex={invite && !text ? 0 : -1}>
            <span>Write something</span>, or scroll
          </button>
          <textarea
            ref={field}
            className="tw__field"
            value={text}
            rows={MAX_LINES}
            autoCapitalize="sentences"
            aria-label="Write something in ink"
            onChange={(e) => {
              const v = e.target.value
              if (fits(v)) setText(v)
            }}
          />
        </>
      )}

      <div className="tw__actions" data-on={text ? '' : undefined}>
        <div className="tw__designs" role="radiogroup" aria-label="Card design">
          {designs.map((d, i) => (
            <button key={d} type="button" role="radio" aria-checked={design === i} className="tw__design" onClick={() => setDesign(i)}>
              <span className="tw__thumb">{thumbs[i] && <img src={thumbs[i]} alt="" />}</span>
              {d}
            </button>
          ))}
        </div>
        <input
          className="tw__sign"
          value={name}
          maxLength={28}
          placeholder="Your name (optional)"
          aria-label="Sign the card with your name (optional)"
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className="tw__btn"
          disabled={printing}
          onClick={() => {
            tick()
            setPrinting(true)
            // Let the label change paint before the card is drawn
            setTimeout(() => print(text, name, design).finally(() => setPrinting(false)), 30)
          }}
        >
          {printing ? 'Printing…' : 'Print it'}
        </button>
        <button type="button" className="tw__btn tw__btn--quiet" onClick={() => setText('')}>Clear</button>
      </div>
    </div>
  )
}
