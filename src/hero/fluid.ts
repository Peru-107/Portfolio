import * as THREE from 'three'

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
  uniform sampler2D uMask; uniform float holdInside; uniform vec2 shift;
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * velTexel + shift;
    vec4 v = texture2D(uSource, coord);
    // Ink inside the letter dries slower than ink that escapes it
    float m = texture2D(uMask, vUv).r;
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

// Paper minus ink, a glossy lit edge where the ink is thick, and the letter's
// edge pushed around by the flow so it never reads as a hard stencil
const DISPLAY = head + /* glsl */ `
  uniform sampler2D uDye; uniform sampler2D uVelocity; uniform sampler2D uMask;
  uniform vec3 paper; uniform vec2 dyeTexel; uniform float time; uniform float outside; uniform float reveal;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    // The flow nudges the letter's edge, so it sways with the ink
    float m = texture2D(uMask, vUv + vel * 0.000025).r;
    float mask = smoothstep(0.42, 0.58, m) * reveal;

    vec3 dye = texture2D(uDye, vUv).rgb;
    float dl = length(texture2D(uDye, vUv - vec2(dyeTexel.x, 0.0)).rgb);
    float dr = length(texture2D(uDye, vUv + vec2(dyeTexel.x, 0.0)).rgb);
    float dt = length(texture2D(uDye, vUv + vec2(0.0, dyeTexel.y)).rgb);
    float db = length(texture2D(uDye, vUv - vec2(0.0, dyeTexel.y)).rgb);
    vec3 n = normalize(vec3((dl - dr) * 2.2, (db - dt) * 2.2, 1.0));
    float spec = pow(max(dot(n, normalize(vec3(-0.4, 0.6, 0.7))), 0.0), 18.0);

    vec3 inside = paper - dye - vec3(0.07);
    inside += spec * 0.22 * smoothstep(0.15, 0.9, length(dye));
    vec3 out_ = paper - dye * outside;
    vec3 col = mix(out_, inside, mask);
    col += (hash(vUv * 900.0 + time) - 0.5) * 0.028;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`

type Uniforms = Record<string, THREE.IUniform>
type Double = { read: THREE.WebGLRenderTarget; write: THREE.WebGLRenderTarget; swap(): void }

export type InkOptions = {
  canvas: HTMLCanvasElement
  mask: HTMLCanvasElement
  paper: [number, number, number]
  inks: [number, number, number][]
  reducedMotion: boolean
}

export class InkField {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.Camera()
  private quad: THREE.Mesh
  private mats: Record<string, THREE.ShaderMaterial> = {}
  private vel!: Double
  private dye!: Double
  private pressure!: Double
  private div!: THREE.WebGLRenderTarget
  private curl!: THREE.WebGLRenderTarget
  private maskTex!: THREE.CanvasTexture
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
  private pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false, down: false }
  private queue: { x: number; y: number; dx: number; dy: number; color: [number, number, number]; r: number }[] = []
  reveal = 0
  /** How much ink shows outside the shapes (trails); 0.1 keeps it subtle */
  set outside(v: number) {
    this.mats.display!.uniforms.outside!.value = v
  }
  private pendingScroll = 0
  private shiftNow: [number, number] = [0, 0]
  private maskTouches = 0
  pressed = false

  constructor(private o: InkOptions) {
    // preserveDrawingBuffer lets the page take a picture of the ink (the printable postcard)
    this.renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.autoClear = false
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2))
    this.quad.frustumCulled = false
    this.scene.add(this.quad)
    this.makeMaskTexture()

    const m = (name: string, frag: string, uniforms: Uniforms) => {
      this.mats[name] = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { texel: { value: new THREE.Vector2() }, ...uniforms }, depthTest: false, depthWrite: false })
    }
    const tex = () => ({ value: null as THREE.Texture | null })
    m('splat', SPLAT, { uTarget: tex(), aspect: { value: 1 }, color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() }, radius: { value: 0.002 } })
    m('advect', ADVECT, { uVelocity: tex(), uSource: tex(), velTexel: { value: new THREE.Vector2() }, dt: { value: 0.016 }, dissipation: { value: 1 }, uMask: { value: this.maskTex }, holdInside: { value: 1 }, shift: { value: new THREE.Vector2() } })
    m('divergence', DIVERGENCE, { uVelocity: tex() })
    m('curl', CURL, { uVelocity: tex() })
    m('vorticity', VORTICITY, { uVelocity: tex(), uCurl: tex(), curl: { value: 16 }, dt: { value: 0.016 } })
    m('pressure', PRESSURE, { uPressure: tex(), uDivergence: tex() })
    m('gradient', GRADIENT, { uPressure: tex(), uVelocity: tex() })
    m('fade', FADE, { uTexture: tex(), value: { value: 0.8 } })
    m('display', DISPLAY, { uDye: tex(), uVelocity: tex(), uMask: { value: this.maskTex }, paper: { value: new THREE.Vector3(...o.paper) }, dyeTexel: { value: new THREE.Vector2() }, time: { value: 0 }, outside: { value: 0.1 }, reveal: { value: 0 } })

    this.resize()
  }

  private target(w: number, h: number) {
    return new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false, wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping })
  }

  private double(w: number, h: number): Double {
    const d = { read: this.target(w, h), write: this.target(w, h), swap() { const t = d.read; d.read = d.write; d.write = t } }
    return d
  }

  // The mask canvas changes size with the window; a texture can't change size
  // in place, so it is rebuilt and handed to the shaders that read it
  private makeMaskTexture() {
    this.maskTex?.dispose()
    this.maskTex = new THREE.CanvasTexture(this.o.mask)
    this.maskTex.minFilter = THREE.LinearFilter
    this.maskTex.magFilter = THREE.LinearFilter
    for (const k of ['advect', 'display']) if (this.mats[k]) this.mats[k]!.uniforms.uMask!.value = this.maskTex
  }

  resize() {
    const c = this.o.canvas
    const w = c.clientWidth || 1
    const h = c.clientHeight || 1
    this.renderer.setSize(w, h, false)
    const aspect = w / h
    const res = (base: number) => (aspect >= 1 ? [Math.round(base * aspect), base] : [base, Math.round(base / aspect)])
    ;[this.simW, this.simH] = res(160)
    ;[this.dyeW, this.dyeH] = res(Math.min(720, Math.round(h * 0.9)))
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

  private pass(name: string, out: THREE.WebGLRenderTarget | null, set: Record<string, unknown>, texel: [number, number]) {
    const mat = this.mats[name]!
    ;(mat.uniforms.texel!.value as THREE.Vector2).set(1 / texel[0], 1 / texel[1])
    for (const k in set) {
      const u = mat.uniforms[k]!
      const v = set[k]
      if (u.value && typeof (u.value as { set?: unknown }).set === 'function' && Array.isArray(v)) (u.value as THREE.Vector3).set(...(v as [number, number, number]))
      else u.value = v
    }
    this.quad.material = mat
    this.renderer.setRenderTarget(out)
    this.renderer.render(this.scene, this.camera)
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

  /** The opening: ink poured down the letter's strokes */
  pour() {
    const pts = this.maskPoints
    if (!pts.length) return
    for (let i = 0; i < 44; i++) {
      const p = pts[Math.floor(Math.random() * pts.length)]!
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
      const p = this.maskPoints[Math.floor(Math.random() * this.maskPoints.length)]!
      // Ink lags behind the content: push it the opposite way to the motion
      this.queue.push({ x: p[0], y: p[1], dx: (Math.random() - 0.5) * 60, dy: -dy * 9, color: this.nextInk(Math.min(0.5, speed / 120)), r: 0.003 })
    }
  }

  /** The mask canvas was redrawn in place (same size): upload it, and now and then re-sample it */
  maskChanged() {
    this.maskTex.needsUpdate = true
    if (this.maskTouches++ % 8 === 0) this.sampleMask()
  }

  /** Ink fed at a point, along a direction: used to pour ink into a line as it draws */
  feed(nx: number, ny: number, dx: number, dy: number, amount = 0.6, r = 0.003) {
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
    for (let i = 0; i < 18; i++) {
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
    // The whole simulation runs at half speed: ink should drift, not rush
    const dt = Math.min((now - this.last) / 1000, 1 / 30) * 0.5
    this.last = now
    this.t += dt

    const p = this.pointer
    if (p.moved) {
      p.moved = false
      const speed = Math.hypot(p.dx, p.dy)
      // Pressing and dragging pulls ink out like taffy: more force, more ink, a wider stroke
      const k = this.pressed ? 2.6 : 1
      this.splat(p.x, p.y, p.dx * 2800 * k, p.dy * 2800 * k, this.nextInk(Math.min(0.5 * k, (0.12 + speed * 6) * k)), this.pressed ? 0.003 : 0.0016)
    }
    while (this.queue.length) {
      const q = this.queue.shift()!
      this.splat(q.x, q.y, q.dx, q.dy, q.color, q.r)
    }
    // Slow drips keep the letter wet when nobody is touching it
    if (this.t - this.ambientAt > 0.2 && this.maskPoints.length) {
      this.ambientAt = this.t
      const pt = this.maskPoints[Math.floor(Math.random() * this.maskPoints.length)]!
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

  start() {
    if (this.running) return
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
    ;[this.vel, this.dye, this.pressure].forEach((d) => (d.read.dispose(), d.write.dispose()))
    this.div.dispose()
    this.curl.dispose()
    Object.values(this.mats).forEach((m) => m.dispose())
    this.maskTex.dispose()
    this.renderer.dispose()
  }
}
