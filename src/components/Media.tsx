import { useEffect, useRef } from 'react'
import type { Media as M } from '../content'

// Each image's full width, and the smaller copies that exist beside it
// (name-400.webp and so on). The browser picks the smallest that stays sharp.
const SIZES: Record<string, [number, number[]]> = {
  'by-1': [1400, [400, 800]], 'by-2': [1400, [400, 800]], 'by-3': [1400, [400, 800]],
  'cube-desk': [1400, [800]], 'cube-poster': [1400, [800]], 'cube-phone': [780, [400, 600]],
  'folio-card': [1200, [800]], 'folio-today': [780, [400, 600]], 'folio-room': [780, [400, 600]],
  'folio-shelf': [780, [400, 600]], 'folio-notes': [780, [400, 600]],
  'nextup-card': [1200, [800]], 'nextup-poster': [720, [400, 600]],
  'stack-by': [1600, [800]], 'stack-cube': [1600, [800]], 'stack-folio': [1600, [800]],
  'stack-nextup': [1600, [800]], 'stack-tv': [1600, [800]],
  'tv-apps': [1280, [800]], 'tv-focus': [1280, [800]], 'tv-home': [1280, [800]], 'tv-panel': [1280, [800]],
}
function responsive(src: string, sizes = '(max-width: 759px) 92vw, 60vw') {
  const name = src.match(/\/media\/([\w-]+)\.webp$/)?.[1]
  const known = name ? SIZES[name] : undefined
  if (!known) return { src }
  const [full, smaller] = known
  const set = [...smaller.map((w) => `${src.replace(/\.webp$/, `-${w}.webp`)} ${w}w`), `${src} ${full}w`]
  return { src, srcSet: set.join(', '), sizes }
}

// Video plays only while on screen, so six projects never decode at once
function Video({ m }: { m: Extract<M, { type: 'video' }> }) {
  const v = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    const el = v.current!
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const io = new IntersectionObserver(([e]) => (e!.isIntersecting ? el.play().catch(() => {}) : el.pause()), { threshold: 0.25, rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  // WebM (VP9) is about a quarter smaller; MP4 stays as the fallback. Nothing
  // downloads until the video is about to play.
  return (
    <video ref={v} className="media__video" poster={m.poster} muted loop playsInline preload="none" aria-label={m.alt}>
      {m.src.endsWith('.mp4') && <source src={m.src.replace(/\.mp4$/, '.webm')} type="video/webm" />}
      <source src={m.src} type="video/mp4" />
    </video>
  )
}

/** `sizes` is how wide a single image is drawn, when it isn't the default case-page width */
export function Media({ m, priority, sizes }: { m: M; priority?: boolean; sizes?: string }) {
  const load = priority ? 'eager' : 'lazy'
  if (m.type === 'row') {
    return (
      <div className="media media--row" data-shape={m.shape} style={{ background: m.bg }} role="img" aria-label={m.alt}>
        {m.srcs.map((s) => <img key={s} {...responsive(s, m.shape === 'screens' ? '(max-width: 759px) 60vw, 30vw' : '(max-width: 759px) 30vw, 14vw')} alt="" loading={load} />)}
      </div>
    )
  }
  if (m.type === 'stack') {
    return (
      <div className="media media--stack" role="img" aria-label={m.alt}>
        {m.srcs.map((s, i) => (
          <img key={s} {...responsive(s, sizes)} alt="" loading={load} style={{ ['--i' as string]: i }} />
        ))}
      </div>
    )
  }
  const frame = m.frame ?? 'none'
  return (
    <figure className="media" data-frame={frame}>
      {frame === 'browser' && <span className="media__bar" aria-hidden="true"><i /><i /><i /></span>}
      {m.type === 'video' ? <Video m={m} /> : <img {...responsive(m.src, sizes)} alt={m.alt} loading={load} />}
    </figure>
  )
}
