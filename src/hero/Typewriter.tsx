import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { site } from '../content'

// Write in ink: type on the first screen and your words are struck onto the
// paper under my name, letter by letter, each one a little uneven like real
// type. Backspace lifts a letter off in a puff, Enter starts a new line.
// "Print it" saves a postcard of your words with the live ink behind them.

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

async function postcard(text: string) {
  await document.fonts.load('400 64px "Courier Prime"')
  await document.fonts.load('800 40px Panchang')
  const W = 1600
  const H = 1000
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e9ecef'
  ctx.fillRect(0, 0, W, H)
  // The live ink, as it is right now, softened behind the words
  const ink = document.querySelector<HTMLCanvasElement>('.hero .ink-canvas')
  if (ink) {
    const s = Math.max(W / ink.width, H / ink.height)
    const w = ink.width * s
    const h = ink.height * s
    ctx.globalAlpha = 0.55
    ctx.drawImage(ink, (W - w) / 2, (H - h) / 2, w, h)
    ctx.globalAlpha = 1
    ctx.fillStyle = 'rgba(233, 236, 239, 0.35)'
    ctx.fillRect(0, 0, W, H)
  }
  // The words, struck in ink with the same small unevenness as on the page
  const lines = text.split('\n')
  const size = 64
  ctx.font = `400 ${size}px "Courier Prime", monospace`
  const lh = size * 1.35
  // Under the name, as on the page
  const top = H * 0.72 - ((lines.length - 1) * lh) / 2
  let i = 0
  lines.forEach((line, li) => {
    const lw = ctx.measureText(line).width
    let x = (W - lw) / 2
    for (const ch of line) {
      const j = jitter(i++)
      ctx.save()
      ctx.translate(x, top + li * lh + j.y)
      ctx.rotate((j.rot * Math.PI) / 180)
      ctx.fillStyle = `rgba(33, 37, 41, ${j.ink})`
      ctx.fillText(ch, 0, 0)
      ctx.restore()
      x += ctx.measureText(ch).width
    }
    i++
  })
  // Signed and dated
  ctx.fillStyle = '#212529'
  ctx.font = '800 30px Panchang, sans-serif'
  ctx.fillText(site.fullName, 64, H - 64)
  ctx.font = '400 24px "Courier Prime", monospace'
  ctx.fillStyle = '#495057'
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const right = `${date}    ${location.host}`
  ctx.fillText(right, W - 64 - ctx.measureText(right).width, H - 66)
  ctx.fillStyle = '#ff6a1a'
  ctx.fillRect(64, H - 52, 40, 4)

  c.toBlob((b) => {
    if (!b) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(b)
    a.download = 'written-in-ink.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }, 'image/png')
}

export function Typewriter({ onWrite }: { onWrite?: () => void }) {
  const [text, setText] = useState('')
  const box = useRef<HTMLDivElement>(null)
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

  const lines = text.split('\n')
  // The same numbering as the postcard: one step per letter, one more per line break
  const starts = lines.reduce<number[]>((acc, _l, i) => [...acc, i === 0 ? 0 : acc[i - 1]! + lines[i - 1]!.length + 1], [])

  return (
    <div className="tw" data-filled={text ? '' : undefined}>
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
          <button type="button" className="tw__write" onClick={() => field.current?.focus()} data-hidden={text ? '' : undefined}>
            Write something
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
        <button type="button" className="tw__btn" onClick={() => postcard(text)}>Print it</button>
        <button type="button" className="tw__btn tw__btn--quiet" onClick={() => setText('')}>Clear</button>
      </div>
    </div>
  )
}
