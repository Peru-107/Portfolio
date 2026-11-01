import { useEffect, useRef } from 'react'
import type { Media as M } from '../content'

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
        {m.srcs.map((s) => <img key={s} src={s} alt="" loading={load} />)}
      </div>
    )
  }
  if (m.type === 'stack') {
    return (
      <div className="media media--stack" role="img" aria-label={m.alt}>
        {m.srcs.map((s, i) => (
          <img key={s} src={s} alt="" loading={load} style={{ ['--i' as string]: i }} />
        ))}
      </div>
    )
  }
  const frame = m.frame ?? 'none'
  return (
    <figure className="media" data-frame={frame}>
      {frame === 'browser' && <span className="media__bar" aria-hidden="true"><i /><i /><i /></span>}
      {m.type === 'video' ? <Video m={m} /> : <img src={m.src} alt={m.alt} loading={load} />}
    </figure>
  )
}
