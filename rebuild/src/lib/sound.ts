// Three quiet clicks, made on the spot from a burst of noise (no files to load):
//   key    a soft key, for buttons and links
//   clack  a deeper clack, for opening a project or a case page
//   tick   a light tick, for toggles and the small hovers in the menus
// On by default and very quiet; the speaker key in the header (and the command
// menu) mutes them, and the choice is remembered. Nothing is created until the
// visitor's first click or key: the browser only allows sound after that, so
// there is never an autoplay warning, and a page nobody touches costs nothing.

export type Sound = 'key' | 'clack' | 'tick'

const KEY = 'pb-muted'
// Band centre (Hz), length (s) and loudness of each click
const TONE: Record<Sound, [number, number, number]> = { key: [2400, 0.035, 0.05], clack: [900, 0.06, 0.07], tick: [5200, 0.018, 0.035] }

let ctx: AudioContext | null = null
const buffers = new Map<Sound, AudioBuffer>()
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
})()
const listeners = new Set<(m: boolean) => void>()

export const isMuted = () => muted

export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem(KEY, m ? '1' : '0')
  } catch {
    /* private mode: remembered for this visit only */
  }
  listeners.forEach((fn) => fn(m))
  // An idle context holds the audio device awake; let it sleep while muted
  if (ctx) void (m ? ctx.suspend() : ctx.resume()).catch(() => {})
}

export function onMuted(fn: (m: boolean) => void) {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

// Built once per kind, the first time it plays: a short decaying noise burst
function buffer(c: AudioContext, kind: Sound) {
  let b = buffers.get(kind)
  if (b) return b
  const n = Math.floor(c.sampleRate * TONE[kind][1])
  b = c.createBuffer(1, n, c.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 6)
  buffers.set(kind, b)
  return b
}

// Only ever called from inside a user gesture (or after one), so the context starts running
function context() {
  if (ctx) return ctx
  const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!A) return null
  ctx = new A({ latencyHint: 'interactive' })
  return ctx
}

let lastAt = -Infinity
export function play(kind: Sound = 'key', gain = 1) {
  if (muted) return
  const ua = navigator.userActivation
  if (ua && !ua.hasBeenActive) return
  try {
    const c = context()
    if (!c) return
    if (c.state === 'suspended') void c.resume().catch(() => {})
    // Never a machine-gun of clicks (wall clock: a new context's own clock sits at 0 until it starts)
    const now = performance.now()
    if (now - lastAt < 30) return
    lastAt = now
    const [f, , vol] = TONE[kind]
    const src = c.createBufferSource()
    src.buffer = buffer(c, kind)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = f
    bp.Q.value = 1.4
    const g = c.createGain()
    g.gain.value = vol * gain
    src.connect(bp).connect(g).connect(c.destination)
    src.start()
  } catch {
    /* sound is a nicety; never let it break a click */
  }
}

// Which click an element makes: its own data-sound, else by what it does
function kindOf(el: Element): Sound | null {
  const own = el.closest<HTMLElement>('[data-sound]')
  if (own) return (own.dataset.sound as Sound | 'none') === 'none' ? null : (own.dataset.sound as Sound)
  const hit = el.closest('a, button, summary, label, [role="button"], [role="option"], input[type="checkbox"], input[type="radio"]')
  if (!hit) return null
  // Opening a project or a case page
  if (hit.matches('a[href^="/work/"], .chapter__link, .w2__card')) return 'clack'
  // Toggles: anything that flips open or shut, on or off
  if (hit.matches('[aria-expanded], [aria-pressed], [role="option"], label, input')) return 'tick'
  return 'key'
}

/** One listener for the whole site, set up once */
let started = false
export function startSound() {
  if (started) return
  started = true
  // Clicks: pointer presses sound on the press (it feels immediate); keyboard
  // activation (Enter or Space on a focused control) arrives as a click
  let pressed: EventTarget | null = null
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0) return
      pressed = e.target
      const k = e.target instanceof Element ? kindOf(e.target) : null
      if (k) play(k)
    },
    { passive: true, capture: true },
  )
  document.addEventListener(
    'click',
    (e) => {
      // Already sounded on the press
      if (pressed && e.detail > 0) return void (pressed = null)
      const k = e.target instanceof Element ? kindOf(e.target) : null
      if (k) play(k)
    },
    { passive: true, capture: true },
  )
  // Small hovers: the header and side index links tick, barely, under a mouse
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let last: Element | null = null
    document.addEventListener(
      'pointerover',
      (e) => {
        const t = e.target instanceof Element ? e.target.closest('.header__nav a, .sidenav a') : null
        if (t === last) return
        last = t
        if (t) play('tick', 0.45)
      },
      { passive: true },
    )
  }
}
