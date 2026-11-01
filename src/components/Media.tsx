import { useEffect, useRef } from 'react'
import type { Media as M } from '../content'

// Images that also exist at 800px wide (name-800.webp), with their full width.
// Phones pick the small file; wide screens keep the original.
const WIDE: Record<string, number> = {
  'by-1': 1400, 'by-2': 1400, 'by-3': 1400, 'cube-desk': 1400, 'cube-poster': 1400,
  'folio-card': 1200, 'nextup-card': 1200, 'stack-by': 1600, 'stack-cube': 1600,
  'stack-folio': 1600, 'stack-nextup': 1600, 'stack-tv': 1600,
  'tv-apps': 1280, 'tv-focus': 1280, 'tv-home': 1280, 'tv-panel': 1280,
}
function responsive(src: string, sizes = '(max-width: 759px) 92vw, 60vw') {
  const name = src.match(/\/media\/([\w-]+)\.webp$/)?.[1]
  const w = name ? WIDE[name] : undefined
  if (!w) return { src }
  return { src, srcSet: `${src.replace(/\.webp$/, '-800.webp')} 800w, ${src} ${w}w`, sizes }
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

export function Media({ m, priority }: { m: M; priority?: boolean }) {
  const load = priority ? 'eager' : 'lazy'
  if (m.type === 'row') {
    return (
      <div className="media media--row" data-shape={m.shape} style={{ background: m.bg }} role="img" aria-label={m.alt}>
        {m.srcs.map((s) => <img key={s} {...responsive(s, '(max-width: 759px) 46vw, 24vw')} alt="" loading={load} />)}
      </div>
    )
  }
  if (m.type === 'stack') {
    return (
      <div className="media media--stack" role="img" aria-label={m.alt}>
        {m.srcs.map((s, i) => (
          <img key={s} {...responsive(s)} alt="" loading={load} style={{ ['--i' as string]: i }} />
        ))}
      </div>
    )
  }
  const frame = m.frame ?? 'none'
  return (
    <figure className="media" data-frame={frame}>
      {frame === 'browser' && <span className="media__bar" aria-hidden="true"><i /><i /><i /></span>}
      {m.type === 'video' ? <Video m={m} /> : <img {...responsive(m.src)} alt={m.alt} loading={load} />}
    </figure>
  )
}
