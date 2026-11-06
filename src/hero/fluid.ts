import { MaskTexture, Program, Renderer, Target, type Uniforms } from './gl'

// A small stable-fluids solver (advect, curl, vorticity, divergence, pressure,
// gradient subtract) on half-float render targets. Dye is stored as the
// amount of light the ink absorbs, so the display can subtract it from paper
// and colors mix the way real ink does.

const vert = /* glsl */ `
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform vec2 texel;
  void main() {
    vUv = uv;
    vL = vUv - vec2(texel.x, 0.0); vR = vUv + vec2(texel.x, 0.0);
    vT = vUv + vec2(0.0, texel.y); vB = vUv - vec2(0.0, texel.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const head = /* glsl */ `
  precision highp float;
  varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
`

const SPLAT = head + /* glsl */ `
  uniform sampler2D uTarget; uniform float aspect; uniform vec3 color; uniform vec2 point; uniform float radius;
  void main() {
    vec2 p = vUv - point; p.x *= aspect;
    vec3 s = exp(-dot(p, p) / radius) * color;
    gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + s, 1.0);
  }
`

const ADVECT = head + /* glsl */ `
  uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 velTexel; uniform float dt; uniform float dissipation;
  uniform sampler2D uMask; uniform vec3 maskXf; uniform float holdInside; uniform vec2 shift;
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * velTexel + shift;
    vec4 v = texture2D(uSource, coord);
    // Ink inside the letter dries slower than ink that escapes it
    float m = texture2D(uMask, vUv * maskXf.x + maskXf.yz).r;
    float d = mix(dissipation, dissipation * holdInside, m);
    gl_FragColor = v / (1.0 + d * dt);
  }
`

const DIVERGENCE = head + /* glsl */ `
  uniform sampler2D uVelocity;
  void main() {
    float L = texture2D(uVelocity, vL).x; float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y; float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) L = -C.x; if (vR.x > 1.0) R = -C.x;
    if (vT.y > 1.0) T = -C.y; if (vB.y < 0.0) B = -C.y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`

const CURL = head + /* glsl */ `
  uniform sampler2D uVelocity;
  void main() {
    float L = texture2D(uVelocity, vL).y; float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x; float B = texture2D(uVelocity, vB).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`

const VORTICITY = head + /* glsl */ `
  uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
  void main() {
    float L = texture2D(uCurl, vL).x; float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x; float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C; force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;
    gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
  }
`

const PRESSURE = head + /* glsl */ `
  uniform sampler2D uPressure; uniform sampler2D uDivergence;
  void main() {
    float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
    float div = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
  }
`

const GRADIENT = head + /* glsl */ `
  uniform sampler2D uPressure; uniform sampler2D uVelocity;
  void main() {
    float L = texture2D(uPressure, vL).x; float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x; float B = texture2D(uPressure, vB).x;
    vec2 v = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
    gl_FragColor = vec4(v, 0.0, 1.0);
  }
`

const FADE = head + /* glsl */ `
  uniform sampler2D uTexture; uniform float value;
  void main() { gl_FragColor = value * texture2D(uTexture, vUv); }
`

// Fills the letter's shape with one ink in a single pass: the loading screen's
// solid word becomes this ink, so the hand-over shows no seam
const FLOOD = head + /* glsl */ `
  uniform sampler2D uTarget; uniform sampler2D uMask; uniform vec3 maskXf; uniform vec3 color;
  void main() {
    float m = smoothstep(0.42, 0.58, texture2D(uMask, vUv * maskXf.x + maskXf.yz).r);
    gl_FragColor = vec4(mix(texture2D(uTarget, vUv).rgb, color, m), 1.0);
  }
`

// Paper minus ink, a glossy lit edge where the ink is thick, and the letter's
// edge pushed around by the flow so it never reads as a hard stencil
const DISPLAY = head + /* glsl */ `
  uniform sampler2D uDye; uniform sampler2D uVelocity; uniform sampler2D uMask; uniform vec3 maskXf;
  uniform vec3 paper; uniform vec2 dyeTexel; uniform float time; uniform float outside; uniform float reveal; uniform float edges;
  // The pointer's recent path: position and velocity (xy, zw), and how much each point still pulls
  uniform vec4 trail[12]; uniform vec4 trailK[3]; uniform vec3 warpBurst;
  uniform float lava;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  // Cheap smooth noise for an organic wobble in the swirl
  float wob(vec2 p) { return sin(p.x * 3.1 + sin(p.y * 2.3 + time)) * cos(p.y * 2.7 - sin(p.x * 1.9 - time * 0.8)); }

  // Fluid-image warp: every point on the pointer's path spins the picture around
  // it (a vortex), drags it along (a smudge), and stirs it with a little noise.
  // The ink is read through this warp, so the letters twist like liquid glass
  vec2 warp(vec2 uv) {
    float aspect = dyeTexel.y / dyeTexel.x;
    vec2 p = uv * vec2(aspect, 1.0);
    vec2 swirl = vec2(0.0);
    for (int i = 0; i < 12; i++) {
      float k = trailK[i / 4][i - (i / 4) * 4];
      if (k < 0.002) continue;
      vec2 at = trail[i].xy * vec2(aspect, 1.0);
      vec2 to = p - at;
      float d = length(to);
      float t = 1.0 - smoothstep(0.0, 0.2, d);
      float f = t * t * t * k * (1.0 + wob(uv * 5.0 + float(i) * 1.7) * 0.4);
      vec2 v = trail[i].zw;
      float speed = min(length(v), 2.4);
      swirl += vec2(-to.y, to.x) / max(d, 0.03) * f * speed * 0.01;
      swirl += v * f * 0.008;
      swirl += vec2(wob(p * 4.0 + time), wob(p.yx * 4.0 - time)) * f * 0.006;
    }
    // A click pushes the ink outward in a ring that spreads and fades
    if (warpBurst.z > 0.002) {
      vec2 to = p - warpBurst.xy * vec2(aspect, 1.0);
      float d = length(to);
      float r = 0.12 + (1.0 - warpBurst.z) * 0.35;
      float t = 1.0 - smoothstep(0.0, r, d);
      swirl += to / max(d, 0.001) * t * t * warpBurst.z * warpBurst.z * 0.05;
    }
    return uv - vec2(swirl.x / aspect, swirl.y);
  }

  // Molten rock: the space folded over itself again and again, a dark crust
  // with veins of deep red, magma and ember where the field crosses zero
  vec3 molten(vec2 uv) {
    float aspect = dyeTexel.y / dyeTexel.x;
    vec2 q = (uv - 0.5) * vec2(aspect, 1.0) * 2.6;
    float k = time * 0.36;
    for (float i = 1.0; i < 9.0; i++) {
      q.x += 0.55 / i * sin(i * 1.7 * q.y + k + i * 0.9);
      q.y += 0.45 / i * cos(i * 1.3 * q.x - k * 0.8 + i * 1.7);
    }
    float f = sin(q.x * 1.4 + q.y * 0.8 + k * 0.6);
    float vein = 1.0 - smoothstep(0.0, 0.6, abs(f));
    float core = 1.0 - smoothstep(0.0, 0.14, abs(f));
    vec3 col = vec3(0.129, 0.145, 0.161);
    col = mix(col, vec3(0.70, 0.15, 0.12), vein * 0.7);
    col = mix(col, vec3(0.965, 0.267, 0.055), pow(vein, 2.2) * 0.9);
    col = mix(col, vec3(1.0, 0.70, 0.22), core * 0.7);
    return col;
  }

  void main() {
    vec2 uv = warp(vUv);
    vec2 vel = texture2D(uVelocity, uv).xy;
    // The flow nudges the letter's edge, so it sways with the ink
    float m = texture2D(uMask, (uv + vel * 0.000025) * maskXf.x + maskXf.yz).r;
    // Anti-aliased edge: as wide as one screen pixel of the mask, however far the
    // warp stretches it, so the letter's outline never breaks into steps
    float aa = max(fwidth(m) * 0.75, 0.012);
    float mask = smoothstep(0.5 - aa, 0.5 + aa, m) * reveal;

    vec3 dye = texture2D(uDye, uv).rgb;
    float dl = length(texture2D(uDye, uv - vec2(dyeTexel.x, 0.0)).rgb);
    float dr = length(texture2D(uDye, uv + vec2(dyeTexel.x, 0.0)).rgb);
    float dt = length(texture2D(uDye, uv + vec2(0.0, dyeTexel.y)).rgb);
    float db = length(texture2D(uDye, uv - vec2(0.0, dyeTexel.y)).rgb);
    vec3 n = normalize(vec3((dl - dr) * 2.2, (db - dt) * 2.2, 1.0));
    float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 18.0);

    // With lava, the letters are molten rock and the ink flows over it like
    // smoke over embers: the lava glows wherever the ink is thin
    vec3 inside = lava > 0.5 ? molten(uv) - dye * 0.6 : paper - dye - vec3(0.07);
    inside += spec * 0.22 * smoothstep(0.15, 0.9, length(dye));
    vec3 out_ = paper - dye * outside;
    vec3 col = mix(out_, inside, mask);
    col += (hash(vUv * 900.0 + time) - 0.5) * 0.028;
    // Soft fade to paper on every side, here rather than as a CSS mask on the
    // canvas, which would make the browser re-composite the page each frame
    float fx = clamp(vUv.x / 0.07, 0.0, 1.0) * clamp((1.0 - vUv.x) / 0.07, 0.0, 1.0);
    float fy = clamp((1.0 - vUv.y) / 0.09, 0.0, 1.0) * clamp(vUv.y / 0.2, 0.0, 1.0);
    col = mix(col, paper, edges * (1.0 - fx * fy));
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`

type Double = { read: Target; write: Target; swap(): void }

export type InkOptions = {
  canvas: HTMLCanvasElement
  mask: HTMLCanvasElement
  paper: [number, number, number]
  inks: [number, number, number][]
  reducedMotion: boolean
  /** Molten rock inside the letters, glowing through the ink that flows over them */
  lava?: boolean
}

export class InkField {
  private renderer: Renderer
  private mats: Record<string, Program> = {}
  private vel!: Double
  private dye!: Double
  private pressure!: Double
  private div!: Target
  private curl!: Target
  private maskTex!: MaskTexture
  private simW = 0
  private simH = 0
  private dyeW = 0
  private dyeH = 0
  private last = performance.now()
  private raf = 0
  private running = false
  private t = 0
  private ambientAt = 0
  private inkIndex = 0
  private maskPoints: [number, number][] = []
  // Where the drawn letter shape sits now: screen uv * k + c gives mask uv.
  // Moving the word (the scroll glide) only changes these three numbers
  private maskXf = [1, 0, 0]
  /** The word moved or scaled since its shape was drawn; follow it without redrawing */
  setMaskTransform(k: number, cx: number, cy: number) {
    this.maskXf[0] = k
    this.maskXf[1] = cx
    this.maskXf[2] = cy
  }
  // A point inside the letter, in today's screen position
  private onWord(p: [number, number]): [number, number] {
    const [k, cx, cy] = this.maskXf as [number, number, number]
    return [(p[0] - cx) / k, (p[1] - cy) / k]
  }
  private pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false, down: false }
  // The pointer's last twelve positions for the warp, newest first, each fading out
  private trail = new Float32Array(48)
  private trailK = new Float32Array(12)
  private warpBurst = [0, 0, 0]
  private queue: { x: number; y: number; dx: number; dy: number; color: [number, number, number]; r: number }[] = []
  reveal = 0
  /** How much ink shows outside the shapes (trails); about a third reads clearly without crowding the name */
  set edges(on: boolean) {
    this.mats.display!.uniforms.edges!.value = on ? 1 : 0
  }
  set outside(v: number) {
    this.mats.display!.uniforms.outside!.value = v
  }
  private pendingScroll = 0
  private shiftNow: [number, number] = [0, 0]
  private sampleTimer = 0
  pressed = false
  // Phones and small machines get a lighter simulation that looks the same at
  // their size: fewer pressure passes, a dye field sized to the screen, and a
  // lower pixel ratio. If frames still run long, the ratio steps down again.
  private light = matchMedia('(hover: none), (max-width: 759px)').matches || (navigator.hardwareConcurrency || 8) <= 4
  private dpr = Math.min(window.devicePixelRatio, this.light ? 1.5 : 2)
  private iterations = this.light ? 12 : 18
  private slowFrames = 0
  private sampled = 0

  constructor(private o: InkOptions) {
    this.renderer = new Renderer(o.canvas)
    this.renderer.setPixelRatio(this.dpr)
    this.makeMaskTexture()

    const m = (name: string, frag: string, uniforms: Uniforms) => {
      this.mats[name] = this.renderer.program(vert, frag, { texel: { value: [0, 0] }, ...uniforms })
    }
    const tex = () => ({ value: null })
    m('splat', SPLAT, { uTarget: tex(), aspect: { value: 1 }, color: { value: [0, 0, 0] }, point: { value: [0, 0] }, radius: { value: 0.002 } })
    m('advect', ADVECT, { uVelocity: tex(), uSource: tex(), velTexel: { value: [0, 0] }, dt: { value: 0.016 }, dissipation: { value: 1 }, uMask: { value: this.maskTex }, maskXf: { value: this.maskXf }, holdInside: { value: 1 }, shift: { value: [0, 0] } })
    m('divergence', DIVERGENCE, { uVelocity: tex() })
    m('curl', CURL, { uVelocity: tex() })
    m('vorticity', VORTICITY, { uVelocity: tex(), uCurl: tex(), curl: { value: 16 }, dt: { value: 0.016 } })
    m('pressure', PRESSURE, { uPressure: tex(), uDivergence: tex() })
    m('gradient', GRADIENT, { uPressure: tex(), uVelocity: tex() })
    m('fade', FADE, { uTexture: tex(), value: { value: 0.8 } })
    m('flood', FLOOD, { uTarget: tex(), uMask: { value: this.maskTex }, maskXf: { value: this.maskXf }, color: { value: [0, 0, 0] } })
    m('display', DISPLAY, { uDye: tex(), uVelocity: tex(), uMask: { value: this.maskTex }, maskXf: { value: this.maskXf }, paper: { value: [...o.paper] }, dyeTexel: { value: [0, 0] }, time: { value: 0 }, outside: { value: 0.32 }, reveal: { value: 0 }, edges: { value: 0 }, trail: { value: this.trail }, trailK: { value: this.trailK }, warpBurst: { value: this.warpBurst }, lava: { value: o.lava ? 1 : 0 } })

    this.resize()
  }

  private target(w: number, h: number) {
    return this.renderer.target(w, h)
  }

  private double(w: number, h: number): Double {
    const d = { read: this.target(w, h), write: this.target(w, h), swap() { const t = d.read; d.read = d.write; d.write = t } }
    return d
  }

  // The mask canvas changes size with the window; a texture can't change size
  // in place, so it is rebuilt and handed to the shaders that read it
  private makeMaskTexture() {
    this.maskTex?.dispose()
    this.maskTex = this.renderer.mask(this.o.mask)
    for (const k of ['advect', 'flood', 'display']) if (this.mats[k]) this.mats[k]!.uniforms.uMask!.value = this.maskTex
  }

  resize() {
    const c = this.o.canvas
    const w = c.clientWidth || 1
    const h = c.clientHeight || 1
    this.renderer.setSize(w, h)
    const aspect = w / h
    const res = (base: number) => (aspect >= 1 ? [Math.round(base * aspect), base] : [base, Math.round(base / aspect)])
    ;[this.simW, this.simH] = res(this.light ? 128 : 160)
    // The dye never needs more pixels than the screen shows along its short side
    const short = Math.min(w, h) * this.dpr
    ;[this.dyeW, this.dyeH] = res(Math.min(this.light ? 420 : 720, Math.round(short * 0.9), Math.round(Math.max(w, h) * 0.9)))
    ;[this.vel, this.dye, this.pressure].forEach((d) => d && (d.read.dispose(), d.write.dispose()))
    this.div?.dispose()
    this.curl?.dispose()
    this.vel = this.double(this.simW, this.simH)
    this.dye = this.double(this.dyeW, this.dyeH)
    this.pressure = this.double(this.simW, this.simH)
    this.div = this.target(this.simW, this.simH)
    this.curl = this.target(this.simW, this.simH)
    this.makeMaskTexture()
    this.sampleMask()
  }

  /** The canvas changed size a little (a phone's address bar, a re-measure):
   * match the drawing surface to it so the letters keep their proportions,
   * without reallocating the simulation and losing the ink */
  fit() {
    this.renderer.setSize(this.o.canvas.clientWidth || 1, this.o.canvas.clientHeight || 1)
  }

  // Points inside the letter, for the ambient drips and the opening pour
  private sampleMask() {
    const mc = this.o.mask
    const ctx = mc.getContext('2d')!
    const { data, width, height } = ctx.getImageData(0, 0, mc.width, mc.height)
    const pts: [number, number][] = []
    const step = Math.max(4, Math.round(width / 120))
    for (let y = 0; y < height; y += step)
      for (let x = 0; x < width; x += step) if (data[(y * width + x) * 4]! > 200) pts.push([x / width, 1 - y / height])
    this.maskPoints = pts
  }

  private pass(name: string, out: Target | null, set: Uniforms[string]['value'] extends infer V ? Record<string, V> : never, texel: [number, number]) {
    const prog = this.mats[name]!
    prog.uniforms.texel!.value = [1 / texel[0], 1 / texel[1]]
    for (const k in set) prog.uniforms[k]!.value = set[k]!
    this.renderer.render(prog, out)
  }

  private splat(x: number, y: number, dx: number, dy: number, color: [number, number, number], r = 0.0022) {
    const aspect = this.o.canvas.clientWidth / Math.max(1, this.o.canvas.clientHeight)
    this.pass('splat', this.vel.write, { uTarget: this.vel.read.texture, aspect, point: [x, y], color: [dx, dy, 0], radius: r }, [this.simW, this.simH])
    this.vel.swap()
    this.pass('splat', this.dye.write, { uTarget: this.dye.read.texture, aspect, point: [x, y], color, radius: r * 1.1 }, [this.dyeW, this.dyeH])
    this.dye.swap()
  }

  private nextInk(scale = 1): [number, number, number] {
    this.inkIndex = (this.inkIndex + 1) % this.o.inks.length
    const c = this.o.inks[this.inkIndex]!
    // A phone-sized letter saturates with far less ink than a desktop one
    const k = scale * Math.pow(Math.min(1, this.o.canvas.clientWidth / 1100), 0.6)
    return [c[0] * k, c[1] * k, c[2] * k]
  }

  /** Fill the letter with ink that reads as the given colour on this paper */
  flood(rgb: [number, number, number]) {
    // The display shows paper minus ink (and a touch more inside the letter)
    const p = this.o.paper
    const color = [p[0] - 0.07 - rgb[0], p[1] - 0.07 - rgb[1], p[2] - 0.07 - rgb[2]]
    this.pass('flood', this.dye.write, { uTarget: this.dye.read.texture, uMask: this.maskTex, color }, [this.dyeW, this.dyeH])
    this.dye.swap()
  }

  /** The opening: ink poured down the letter's strokes */
  pour() {
    const pts = this.maskPoints
    if (!pts.length) return
    for (let i = 0; i < 44; i++) {
      const p = this.onWord(pts[Math.floor(Math.random() * pts.length)]!)
      const a = Math.random() * Math.PI * 2
      this.queue.push({ x: p[0], y: p[1], dx: Math.cos(a) * 240, dy: Math.sin(a) * 240 - 110, color: this.nextInk(1.2), r: 0.008 })
    }
  }

  /** The page scrolled by dy CSS pixels: the ink travels with it, and fast scrolls smear it */
  scroll(dy: number) {
    this.pendingScroll += dy
    const speed = Math.abs(dy)
    if (speed < 3 || !this.maskPoints.length) return
    const n = Math.min(4, Math.ceil(speed / 25))
    for (let i = 0; i < n; i++) {
      const p = this.onWord(this.maskPoints[Math.floor(Math.random() * this.maskPoints.length)]!)
      // Ink lags behind the content: push it the opposite way to the motion
      this.queue.push({ x: p[0], y: p[1], dx: (Math.random() - 0.5) * 60, dy: -dy * 9, color: this.nextInk(Math.min(0.5, speed / 120)), r: 0.003 })
    }
  }

  /** The mask canvas was redrawn in place (same size): upload it, and now and then re-sample it */
  maskChanged() {
    this.maskTex.needsUpdate = true
    // Reading the mask back is slow; do it once the shape has stopped moving
    clearTimeout(this.sampleTimer)
    this.sampleTimer = window.setTimeout(() => this.sampleMask(), 250)
  }

  /** Ink fed at a point, along a direction: used to pour ink into a line as it draws */
  feed(nx: number, ny: number, dx: number, dy: number, amount = 0.6, r = 0.003) {
    if (!this.running || this.queue.length > 48) return
    this.queue.push({ x: nx, y: ny, dx, dy, color: this.nextInk(amount), r })
  }

  move(nx: number, ny: number) {
    const p = this.pointer
    p.dx = nx - p.x
    p.dy = ny - p.y
    p.x = nx
    p.y = ny
    p.moved = Math.abs(p.dx) + Math.abs(p.dy) > 0
  }

  /** A splash of ink somewhere inside the shape */
  splash() {
    const pts = this.maskPoints
    if (!pts.length) return
    const p = pts[Math.floor(Math.random() * pts.length)]!
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2
      this.queue.push({ x: p[0], y: p[1], dx: Math.cos(a) * 420, dy: Math.sin(a) * 420, color: this.nextInk(0.9), r: 0.004 })
    }
  }

  burst(nx: number, ny: number) {
    this.warpBurst[0] = nx
    this.warpBurst[1] = ny
    this.warpBurst[2] = 1
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      this.queue.push({ x: nx, y: ny, dx: Math.cos(a) * 500, dy: Math.sin(a) * 500, color: this.nextInk(0.6), r: 0.0018 })
    }
  }

  private step(dt: number) {
    const sim: [number, number] = [this.simW, this.simH]
    const dyeT: [number, number] = [this.dyeW, this.dyeH]
    this.pass('curl', this.curl, { uVelocity: this.vel.read.texture }, sim)
    this.pass('vorticity', this.vel.write, { uVelocity: this.vel.read.texture, uCurl: this.curl.texture, dt }, sim)
    this.vel.swap()
    this.pass('divergence', this.div, { uVelocity: this.vel.read.texture }, sim)
    this.pass('fade', this.pressure.write, { uTexture: this.pressure.read.texture, value: 0.8 }, sim)
    this.pressure.swap()
    for (let i = 0; i < this.iterations; i++) {
      this.pass('pressure', this.pressure.write, { uPressure: this.pressure.read.texture, uDivergence: this.div.texture }, sim)
      this.pressure.swap()
    }
    this.pass('gradient', this.vel.write, { uPressure: this.pressure.read.texture, uVelocity: this.vel.read.texture }, sim)
    this.vel.swap()
    this.pass('advect', this.vel.write, { uVelocity: this.vel.read.texture, uSource: this.vel.read.texture, velTexel: [1 / this.simW, 1 / this.simH], dt, dissipation: 0.25, holdInside: 1, shift: this.shiftNow }, sim)
    this.vel.swap()
    this.pass('advect', this.dye.write, { uVelocity: this.vel.read.texture, uSource: this.dye.read.texture, velTexel: [1 / this.simW, 1 / this.simH], dt, dissipation: 1.4, holdInside: 0.03, shift: this.shiftNow }, dyeT)
    this.dye.swap()
  }

  private frame = () => {
    const now = performance.now()
    this.adapt(now - this.last)
    // The whole simulation runs at half speed: ink should drift, not rush
    const dt = Math.min((now - this.last) / 1000, 1 / 30) * 0.5
    this.last = now
    this.t += dt

    const p = this.pointer
    const real = dt * 2
    // The warp trail fades on its own clock, whatever the frame rate
    const fade = Math.exp(-real * 3.4)
    for (let i = 0; i < 12; i++) this.trailK[i] = this.trailK[i]! * fade
    this.warpBurst[2] = this.warpBurst[2]! * Math.exp(-real * 2.6)
    if (p.moved) {
      // Newest point at the front; velocity in screen-heights per second
      this.trail.copyWithin(4, 0, 44)
      this.trailK.copyWithin(1, 0, 11)
      const per = 1 / Math.max(real, 1 / 120)
      this.trail.set([p.x, p.y, p.dx * per * (this.dyeW / this.dyeH), p.dy * per], 0)
      this.trailK[0] = 1
    }
    if (p.moved) {
      p.moved = false
      const speed = Math.hypot(p.dx, p.dy)
      // Pressing and dragging pulls ink out like taffy: more force, more ink, a wider stroke
      const k = this.pressed ? 2.6 : 1
      this.splat(p.x, p.y, p.dx * 2800 * k, p.dy * 2800 * k, this.nextInk(Math.min(0.5 * k, (0.12 + speed * 6) * k)), this.pressed ? 0.003 : 0.0016)
    }
    for (let n = 0; n < 10 && this.queue.length; n++) {
      const q = this.queue.shift()!
      this.splat(q.x, q.y, q.dx, q.dy, q.color, q.r)
    }
    // Slow drips keep the letter wet when nobody is touching it
    if (this.t - this.ambientAt > 0.2 && this.maskPoints.length) {
      this.ambientAt = this.t
      const pt = this.onWord(this.maskPoints[Math.floor(Math.random() * this.maskPoints.length)]!)
      const a = Math.random() * Math.PI * 2
      this.splat(pt[0], pt[1], Math.cos(a) * 70, Math.sin(a) * 70 - 25, this.nextInk(1), 0.006)
    }

    // Content moved since last frame: shift the whole field with it
    this.shiftNow = [0, -this.pendingScroll / Math.max(1, this.o.canvas.clientHeight)]
    this.pendingScroll = 0
    this.step(dt)
    this.pass('display', null, { uDye: this.dye.read.texture, uVelocity: this.vel.read.texture, dyeTexel: [1 / this.dyeW, 1 / this.dyeH], time: this.t, reveal: this.reveal }, [this.dyeW, this.dyeH])
    if (this.running) this.raf = requestAnimationFrame(this.frame)
  }

  // Watches real frame times for a few seconds after each start; a device that
  // can't keep up drops pressure passes first and only then a little sharpness
  private adapt(ms: number) {
    if (this.sampled > 240 || ms > 200) return
    this.sampled++
    this.slowFrames = ms > 22 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1)
    if (this.slowFrames < 30) return
    this.slowFrames = 0
    // Sharpness goes last: fewer pressure passes first, and the pixel ratio
    // never drops below 1.5 on screens that have one
    const floor = Math.min(1.5, window.devicePixelRatio || 1)
    if (this.iterations > 8) this.iterations -= 4
    else if (this.dpr > floor) {
      this.dpr = Math.max(floor, this.dpr - 0.25)
      this.renderer.setPixelRatio(this.dpr)
      this.renderer.setSize(this.o.canvas.clientWidth || 1, this.o.canvas.clientHeight || 1)
    }
  }

  start() {
    if (this.running) return
    this.sampled = 0
    this.running = true
    this.last = performance.now()
    if (this.o.reducedMotion) {
      // One settled frame: pour, let it spread, then hold still
      this.reveal = 1
      this.pour()
      for (let i = 0; i < 90; i++) this.frame()
      this.running = false
      return
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  refreshMask() {
    this.makeMaskTexture()
    this.sampleMask()
  }

  dispose() {
    this.stop()
    clearTimeout(this.sampleTimer)
    ;[this.vel, this.dye, this.pressure].forEach((d) => (d.read.dispose(), d.write.dispose()))
    this.div.dispose()
    this.curl.dispose()
    Object.values(this.mats).forEach((m) => m.dispose())
    this.maskTex.dispose()
    this.renderer.dispose()
  }
}
