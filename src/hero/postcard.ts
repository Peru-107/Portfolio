// "Print it": your words, set on a card of their own. Three designs, each
// with ink grown fresh for this card (never my name behind the words), a
// print-shop layer of marks and labels, and a credit line at the foot.

const W = 1600
const H = 1000
const SITE = 'perraz-badhniwalla.vercel.app'
const C = { paper: '#e9ecef', paper2: '#dee2e6', ink: '#212529', soft: '#495057', magma: '#ff6a1a', ember: '#ffb238', deep: '#b3261e' }

type Ctx = CanvasRenderingContext2D
type Rnd = () => number

// Seeded, so the same words on the same minute always print the same card
function seeded(seed: number): Rnd {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}
function hash(str: string) {
  let h = 2166136261
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}
const gauss = (r: Rnd) => (r() + r() + r() - 1.5) / 1.5

// The same small unevenness per letter as on the page
function jitter(i: number) {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  return { rot: (r(1) - 0.5) * 3.2, y: (r(2) - 0.5) * 3, ink: 0.78 + r(3) * 0.22 }
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// Marbled ink, grown fresh for each card: noise folded into itself a few
// times (domain warping), which curls the way ink does in water. Pools sit
// at the given centres and fade out before they reach the words.
type Pool = { x: number; y: number; rx: number; ry: number }
function marble(rnd: Rnd, pools: Pool[], palette: [string, string, string], strength = 1) {
  const w = 640
  const h = 400
  const perm = new Uint8Array(512)
  const base = [...Array(256).keys()].sort(() => rnd() - 0.5)
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255]!
  const grad = (i: number) => perm[i]! / 255
  const fade = (t: number) => t * t * (3 - 2 * t)
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const xf = fade(x - xi)
    const yf = fade(y - yi)
    const X = xi & 255
    const Y = yi & 255
    const a = grad(perm[X]! + Y)
    const b = grad(perm[X + 1]! + Y)
    const c = grad(perm[X]! + Y + 1)
    const d = grad(perm[X + 1]! + Y + 1)
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf
  }
  const fbm = (x: number, y: number) => {
    let v = 0
    let amp = 0.5
    for (let o = 0; o < 4; o++) {
      v += amp * noise(x, y)
      x = x * 2.03 + 17.1
      y = y * 2.03 + 3.7
      amp *= 0.5
    }
    return v
  }
  const cols = palette.map((hex) => {
    const n = parseInt(hex.slice(1), 16)
    return [n >> 16, (n >> 8) & 255, n & 255]
  })
  const ox = rnd() * 50
  const oy = rnd() * 50
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const X = (x / w) * W
      const Y = (y / h) * H
      let region = 0
      for (const p of pools) {
        const dx = (X - p.x) / p.rx
        const dy = (Y - p.y) / p.ry
        region = Math.max(region, 1 - Math.sqrt(dx * dx + dy * dy))
      }
      const i = (y * w + x) * 4
      if (region <= -0.25) continue
      const px = (x / w) * 3.2 + ox
      const py = (y / h) * 2 + oy
      const qx = fbm(px, py)
      const qy = fbm(px + 5.2, py + 1.3)
      const rx = fbm(px + 4 * qx + 1.7, py + 4 * qy + 9.2)
      const ry = fbm(px + 4 * qx + 8.3, py + 4 * qy + 2.8)
      const f = fbm(px + 4 * rx, py + 4 * ry)
      // The pool's edge is torn by the same flow, not a clean circle
      const edge = region + (f - 0.5) * 0.9
      const body = Math.min(1, Math.max(0, edge * 2.2))
      const vein = Math.pow(0.5 + 0.5 * Math.sin((f + rx * 0.6) * 26), 6)
      const a = Math.min(1, body * (0.35 + 0.65 * f) + vein * body * 0.5) * strength
      if (a <= 0.003) continue
      const t = Math.min(1, Math.max(0, (qy - 0.3) * 2.4))
      const u = Math.min(1, Math.max(0, (ry - 0.35) * 2.6))
      for (let k = 0; k < 3; k++) {
        const m = cols[0]![k]! + (cols[1]![k]! - cols[0]![k]!) * t
        img.data[i + k] = m + (cols[2]![k]! - m) * u
      }
      img.data[i + 3] = a * 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}
function pour(ctx: Ctx, ink: HTMLCanvasElement, mode: GlobalCompositeOperation = 'source-over') {
  ctx.save()
  ctx.globalCompositeOperation = mode
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(ink, 0, 0, W, H)
  ctx.restore()
}

function grain(ctx: Ctx, rnd: Rnd, alpha: number) {
  const g = document.createElement('canvas')
  g.width = g.height = 160
  const gc = g.getContext('2d')!
  const img = gc.createImageData(160, 160)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255 * alpha
  }
  gc.putImageData(img, 0, 0)
  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = ctx.createPattern(g, 'repeat')!
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
}

function grid(ctx: Ctx, color: string, step = 40) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = step; x < W; x += step) (ctx.moveTo(x + 0.5, 0), ctx.lineTo(x + 0.5, H))
  for (let y = step; y < H; y += step) (ctx.moveTo(0, y + 0.5), ctx.lineTo(W, y + 0.5))
  ctx.stroke()
  ctx.restore()
}

// Printer's crop marks and a registration target
function marks(ctx: Ctx, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  const m = 36
  const l = 26
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const) {
    ctx.beginPath()
    ctx.moveTo(x, y + sy * l)
    ctx.lineTo(x, y)
    ctx.lineTo(x + sx * l, y)
    ctx.stroke()
  }
  ctx.restore()
}
function target(ctx: Ctx, x: number, y: number, color: string) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.moveTo(x - 22, y)
  ctx.lineTo(x + 22, y)
  ctx.moveTo(x, y - 22)
  ctx.lineTo(x, y + 22)
  ctx.stroke()
  ctx.restore()
}
// The colour bar printers check a run against
function swatches(ctx: Ctx, x: number, y: number, list: string[], edge: string) {
  list.forEach((c, i) => {
    ctx.fillStyle = c
    ctx.fillRect(x + i * 30, y, 24, 24)
    ctx.strokeStyle = edge
    ctx.lineWidth = 1
    ctx.strokeRect(x + i * 30 + 0.5, y + 0.5, 23, 23)
  })
}

function mono(ctx: Ctx, size: number, color: string) {
  ctx.font = `400 ${size}px "Courier Prime", monospace`
  ctx.fillStyle = color
}

function words(ctx: Ctx, lines: string[], cx: number, cy: number, size: number, color: string, align: 'center' | 'left' = 'center') {
  ctx.font = `400 ${size}px "Courier Prime", monospace`
  const lh = size * 1.35
  const top = cy - ((lines.length - 1) * lh) / 2
  let i = 0
  lines.forEach((line, li) => {
    let x = align === 'center' ? cx - ctx.measureText(line).width / 2 : cx
    for (const ch of line) {
      const j = jitter(i++)
      ctx.save()
      ctx.translate(x, top + li * lh + j.y)
      ctx.rotate((j.rot * Math.PI) / 180)
      ctx.globalAlpha = j.ink
      ctx.fillStyle = color
      ctx.fillText(ch, 0, 0)
      ctx.restore()
      x += ctx.measureText(ch).width
    }
    i++
  })
}

// The credit, the same on every card
// Signed by whoever wrote it, if they gave a name; the link is always there.
// Each sits on a small label of the card's own ground, so it reads over any ink.
function credit(ctx: Ctx, meta: Meta, color: string, quiet: string, accent: string) {
  const ground = color === C.paper ? 'rgba(22, 25, 28, 0.85)' : rgba(C.paper, 0.88)
  const label = (t: string, x: number, size: number, ink: string, right = false) => {
    mono(ctx, size, ink)
    const w = ctx.measureText(t).width
    const left = right ? x - w : x
    ctx.fillStyle = ground
    ctx.beginPath()
    ctx.roundRect(left - 14, H - 56 - size - 4, w + 28, size + 18, 6)
    ctx.fill()
    ctx.fillStyle = ink
    ctx.fillText(t, left, H - 56)
  }
  ctx.fillStyle = accent
  ctx.fillRect(72, H - 104, 32, 4)
  if (meta.name) {
    label(`Written by ${meta.name}`, 72, 28, color)
    label(SITE, W - 72, 22, quiet, true)
  } else {
    label(SITE, 72, 24, color)
  }
}

type Meta = { no: string; date: string; time: string; name: string }

// 1. Bloom: pale paper, warm ink blooming in from two corners, a fine grid
function bloomCard(ctx: Ctx, rnd: Rnd, lines: string[], meta: Meta) {
  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, W, H)
  grid(ctx, rgba(C.ink, 0.05))
  pour(ctx, marble(rnd, [
    { x: W * (0.05 + rnd() * 0.1), y: H * (0.05 + rnd() * 0.15), rx: 560, ry: 420 },
    { x: W * (0.88 + rnd() * 0.1), y: H * (0.85 + rnd() * 0.1), rx: 600, ry: 440 },
  ], [C.deep, C.magma, C.ink]), 'multiply')
  grain(ctx, rnd, 0.12)
  marks(ctx, rgba(C.ink, 0.5))
  mono(ctx, 22, C.soft)
  for (const [i, t] of [`${meta.date}, ${meta.time}`, `Written in ink, No. ${meta.no}`].entries()) ctx.fillText(t, W - 72 - ctx.measureText(t).width, 92 + i * 30)
  words(ctx, lines, W / 2, H / 2, 68, C.ink)
  swatches(ctx, W / 2 - 59, H - 80, [C.ink, C.deep, C.magma, C.ember], rgba(C.ink, 0.2))
  credit(ctx, meta, C.ink, C.soft, C.magma)
}

// 2. Night: dark ground, the ink glowing magma, a technical frame and rulers
function nightCard(ctx: Ctx, rnd: Rnd, lines: string[], meta: Meta) {
  ctx.fillStyle = '#16191c'
  ctx.fillRect(0, 0, W, H)
  pour(ctx, marble(rnd, [
    { x: W * (0.3 + rnd() * 0.4), y: H * 1.05, rx: 900, ry: 520 },
    { x: W * 0.95, y: H * 0.05, rx: 420, ry: 320 },
  ], [C.deep, C.magma, C.ember], 0.85), 'screen')
  // Keep the words' band dark enough to read
  const band = ctx.createLinearGradient(0, H * 0.3, 0, H * 0.7)
  band.addColorStop(0, 'rgba(22, 25, 28, 0)')
  band.addColorStop(0.5, 'rgba(22, 25, 28, 0.55)')
  band.addColorStop(1, 'rgba(22, 25, 28, 0)')
  ctx.fillStyle = band
  ctx.fillRect(0, 0, W, H)
  grid(ctx, 'rgba(233, 236, 239, 0.04)')
  // Rulers along the top and left edges
  ctx.strokeStyle = 'rgba(233, 236, 239, 0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 120; x < W - 60; x += 20) (ctx.moveTo(x + 0.5, 60), ctx.lineTo(x + 0.5, x % 100 === 0 ? 78 : 68))
  for (let y = 120; y < H - 120; y += 20) (ctx.moveTo(60, y + 0.5), ctx.lineTo(y % 100 === 0 ? 78 : 68, y + 0.5))
  ctx.stroke()
  target(ctx, W - 96, 96, 'rgba(233, 236, 239, 0.5)')
  mono(ctx, 20, 'rgba(233, 236, 239, 0.55)')
  ctx.fillText(`No. ${meta.no}`, 120, 116)
  ctx.fillText(`19.07° N, 72.87° E   ${meta.date}   ${meta.time}`, 120, 146)
  words(ctx, lines, W / 2, H / 2 + 10, 70, C.paper)
  grain(ctx, rnd, 0.1)
  credit(ctx, meta, C.paper, 'rgba(233, 236, 239, 0.6)', C.magma)
}

// 3. Proof: a typeset proof sheet. Ink pooled on the right, words set left, notes in the margin
function proofCard(ctx: Ctx, rnd: Rnd, lines: string[], meta: Meta) {
  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, W, H)
  const split = W * 0.62
  pour(ctx, marble(rnd, [
    { x: split + 300, y: H * 0.35, rx: 420, ry: 520 },
    { x: split + 340, y: H * 0.95, rx: 300, ry: 300 },
  ], [C.ink, C.deep, C.magma]), 'multiply')
  grain(ctx, rnd, 0.12)
  // The column for the words
  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, split, H)
  grid(ctx, rgba(C.ink, 0.04))
  ctx.strokeStyle = rgba(C.ink, 0.35)
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(split + 0.5, 60)
  ctx.lineTo(split + 0.5, H - 130)
  ctx.moveTo(150.5, 160)
  ctx.lineTo(150.5, H - 200)
  ctx.stroke()
  marks(ctx, rgba(C.ink, 0.5))
  mono(ctx, 20, C.soft)
  ctx.fillText(`Proof No. ${meta.no}`, 72, 100)
  ctx.fillText(`${meta.date}, ${meta.time}`, 72, 128)
  // Margin notes, like a typesetter's
  ctx.fillStyle = C.magma
  lines.forEach((_, i) => {
    const y = H / 2 - ((lines.length - 1) * 64 * 1.35) / 2 + i * 64 * 1.35
    ctx.fillRect(110, y - 22, 14, 14)
  })
  words(ctx, lines, 190, H / 2, 64, C.ink, 'left')
  mono(ctx, 18, C.soft)
  ctx.fillText('Courier Prime, 64 pt', 190, H - 180)
  swatches(ctx, split - 140, H - 180, [C.ink, C.deep, C.magma, C.ember], rgba(C.ink, 0.2))
  credit(ctx, meta, C.ink, C.soft, C.magma)
}

export const designs = [
  { name: 'Bloom', draw: bloomCard },
  { name: 'Night', draw: nightCard },
  { name: 'Proof', draw: proofCard },
]

export async function postcard(text: string, name = '', design = 0) {
  await document.fonts.load('400 64px "Courier Prime"')
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  const now = new Date()
  const seed = hash(text + now.toISOString().slice(0, 16))
  const meta: Meta = {
    no: String(seed % 10000).padStart(4, '0'),
    date: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now),
    time: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(now),
    name: name.trim().slice(0, 28),
  }
  designs[design]!.draw(ctx, seeded(seed), text.split('\n'), meta)

  await new Promise<void>((done) =>
    c.toBlob((b) => {
      if (b) {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(b)
        a.download = `written-in-ink-${meta.no}.png`
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      }
      done()
    }, 'image/png'),
  )
}
