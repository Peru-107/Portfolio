import { useEffect, useRef } from 'react'

// A market line drawn like a brush stroke. It drifts slowly to the left;
// near the cursor the line lifts toward it and burns ember-hot.
export function MarketInk() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    let w = 0
    let h = 0
    const fit = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      w = c.clientWidth
      h = c.clientHeight
      c.width = w * dpr
      c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(c)

    // A seeded random walk with a gentle upward drift, long enough to scroll
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const N = 600
    const pts: number[] = []
    let v = 0.5
    for (let i = 0; i < N; i++) {
      v += (rand() - 0.48) * 0.035
      v = Math.max(0.15, Math.min(0.85, v))
      pts.push(v)
    }

    const pointer = { x: -1, y: -1, k: 0 }
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    addEventListener('pointermove', move, { passive: true })

    let raf = 0
    let off = 0
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const draw = () => {
      off += reduced ? 0 : 0.04
      const inside = pointer.x >= 0 && pointer.x <= w && pointer.y >= 0 && pointer.y <= h
      pointer.k += ((inside ? 1 : 0) - pointer.k) * 0.06
      ctx.clearRect(0, 0, w, h)

      // Faint ruled grid, like ledger paper
      ctx.strokeStyle = 'rgba(33,37,41,0.07)'
      ctx.lineWidth = 1
      for (let y = h / 6; y < h; y += h / 6) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      const step = w / 120
      const line: [number, number, number][] = []
      for (let i = 0; i <= 120; i++) {
        const x = i * step
        const f = off + i
        const a = pts[Math.floor(f) % N]!
        const b = pts[(Math.floor(f) + 1) % N]!
        let y = (1 - (a + (b - a) * (f % 1))) * h
        const d = Math.abs(x - pointer.x)
        const pull = Math.exp(-(d * d) / (2 * 70 * 70)) * pointer.k
        y += (pointer.y - y) * pull * 0.55
        line.push([x, y, pull])
      }

      // Soft area under the stroke
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, 'rgba(255,106,26,0.16)')
      g.addColorStop(1, 'rgba(255,106,26,0)')
      ctx.beginPath()
      ctx.moveTo(0, h)
      line.forEach(([x, y]) => ctx.lineTo(x, y))
      ctx.lineTo(w, h)
      ctx.fillStyle = g
      ctx.fill()

      // The stroke: thick charcoal ink, hot where the cursor holds it
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < line.length; i++) {
        const [x0, y0] = line[i - 1]!
        const [x1, y1, p] = line[i]!
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.lineWidth = 3 + p * 7
        const r = Math.round(33 + (255 - 33) * p)
        const gg = Math.round(37 + (106 - 37) * p)
        const bb = Math.round(41 + (26 - 41) * p)
        ctx.strokeStyle = `rgb(${r},${gg},${bb})`
        ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      removeEventListener('pointermove', move)
    }
  }, [])

  return <canvas ref={canvas} className="lab__canvas" aria-hidden="true" />
}
