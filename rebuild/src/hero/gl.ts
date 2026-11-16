// The few pieces of WebGL the ink needs, written directly instead of pulling in
// a 3D library: half-float render targets, a full-screen quad, shader programs
// with named uniforms, and the letter mask uploaded from a canvas.

export type Value = number | number[] | Float32Array | Target | MaskTexture | null
export type Uniforms = Record<string, { value: Value }>

export class Target {
  readonly tex: WebGLTexture
  readonly fbo: WebGLFramebuffer
  constructor(
    private gl: WebGL2RenderingContext,
    readonly w: number,
    readonly h: number,
  ) {
    this.tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
    this.fbo = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
  }
  /** Same shape as a render target's texture, so passes can read it directly */
  get texture() {
    return this
  }
  dispose() {
    this.gl.deleteTexture(this.tex)
    this.gl.deleteFramebuffer(this.fbo)
  }
}

// The letter shape, drawn on a 2D canvas and uploaded when it changes
export class MaskTexture {
  readonly tex: WebGLTexture
  needsUpdate = true
  constructor(
    private gl: WebGL2RenderingContext,
    readonly source: HTMLCanvasElement,
  ) {
    this.tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }
  upload() {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    // Canvas rows run top to bottom; texture rows bottom to top
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.source)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    this.needsUpdate = false
  }
  dispose() {
    this.gl.deleteTexture(this.tex)
  }
}

// Shaders are written in the older GLSL style; these lines translate them for WebGL 2
const VERT_PRE = '#version 300 es\nprecision highp float;\n#define attribute in\n#define varying out\nin vec2 position;\nin vec2 uv;\n'
const FRAG_PRE = '#version 300 es\n#define varying in\n#define texture2D texture\nout highp vec4 fragColor;\n#define gl_FragColor fragColor\n'

export class Program {
  readonly prog: WebGLProgram
  private loc = new Map<string, WebGLUniformLocation | null>()
  constructor(
    private gl: WebGL2RenderingContext,
    vert: string,
    frag: string,
    readonly uniforms: Uniforms,
  ) {
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const v = shader(gl.VERTEX_SHADER, VERT_PRE + vert)
    const f = shader(gl.FRAGMENT_SHADER, FRAG_PRE + frag)
    this.prog = gl.createProgram()!
    gl.attachShader(this.prog, v)
    gl.attachShader(this.prog, f)
    gl.bindAttribLocation(this.prog, 0, 'position')
    gl.bindAttribLocation(this.prog, 1, 'uv')
    gl.linkProgram(this.prog)
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw new Error(gl.getShaderInfoLog(v) || gl.getShaderInfoLog(f) || gl.getProgramInfoLog(this.prog) || 'shader failed')
    }
    gl.deleteShader(v)
    gl.deleteShader(f)
  }
  location(name: string) {
    if (!this.loc.has(name)) this.loc.set(name, this.gl.getUniformLocation(this.prog, name))
    return this.loc.get(name)!
  }
  dispose() {
    this.gl.deleteProgram(this.prog)
  }
}

export class Renderer {
  readonly gl: WebGL2RenderingContext
  private quad: WebGLVertexArrayObject
  private buffers: WebGLBuffer[] = []
  private ratio = 1

  constructor(private canvas: HTMLCanvasElement) {
    // alpha: an opaque canvas starts (and restarts, after any resize) as solid
    // black until it is drawn, and on Windows it can be lifted into a hardware
    // overlay that flashes black when it is handed back to the page. With an
    // alpha channel an undrawn frame is see-through (paper shows), and the
    // shaders still write alpha 1, so every drawn frame looks the same
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false })
    // Ink lives in half floats (it goes negative and above one), which the GPU must be able to draw into
    if (!gl || !gl.getExtension('EXT_color_buffer_float')) throw new Error('WebGL 2 with float targets is not available')
    gl.getExtension('EXT_color_buffer_half_float')
    this.gl = gl
    gl.disable(gl.DEPTH_TEST)
    gl.disable(gl.BLEND)
    // One quad covering the screen, as a strip: position then texture coordinate
    this.quad = gl.createVertexArray()!
    gl.bindVertexArray(this.quad)
    const attr = (index: number, data: number[]) => {
      const b = gl.createBuffer()!
      this.buffers.push(b)
      gl.bindBuffer(gl.ARRAY_BUFFER, b)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
      gl.enableVertexAttribArray(index)
      gl.vertexAttribPointer(index, 2, gl.FLOAT, false, 0, 0)
    }
    attr(0, [-1, -1, 1, -1, -1, 1, 1, 1])
    attr(1, [0, 0, 1, 0, 0, 1, 1, 1])
  }

  setPixelRatio(r: number) {
    this.ratio = r
  }

  /** True when the drawing surface really changed size (and so was emptied) */
  setSize(w: number, h: number) {
    const cw = Math.max(1, Math.round(w * this.ratio))
    const ch = Math.max(1, Math.round(h * this.ratio))
    let changed = false
    if (this.canvas.width !== cw) (this.canvas.width = cw), (changed = true)
    if (this.canvas.height !== ch) (this.canvas.height = ch), (changed = true)
    return changed
  }

  target(w: number, h: number) {
    return new Target(this.gl, w, h)
  }
  mask(source: HTMLCanvasElement) {
    return new MaskTexture(this.gl, source)
  }
  program(vert: string, frag: string, uniforms: Uniforms) {
    return new Program(this.gl, vert, frag, uniforms)
  }

  /** Draw the full-screen quad with a program, into a target or onto the screen */
  render(p: Program, out: Target | null) {
    const gl = this.gl
    gl.useProgram(p.prog)
    let unit = 0
    for (const name in p.uniforms) {
      const v = p.uniforms[name]!.value
      const loc = p.location(name)
      if (loc === null || v === null) continue
      if (typeof v === 'number') gl.uniform1f(loc, v)
      // Packed arrays are always vec4[]: four numbers per entry
      else if (v instanceof Float32Array) gl.uniform4fv(loc, v)
      else if (Array.isArray(v)) {
        if (v.length === 2) gl.uniform2f(loc, v[0]!, v[1]!)
        else gl.uniform3f(loc, v[0]!, v[1]!, v[2]!)
      } else {
        if (v instanceof MaskTexture && v.needsUpdate) v.upload()
        gl.activeTexture(gl.TEXTURE0 + unit)
        gl.bindTexture(gl.TEXTURE_2D, v.tex)
        gl.uniform1i(loc, unit++)
      }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fbo : null)
    gl.viewport(0, 0, out ? out.w : this.canvas.width, out ? out.h : this.canvas.height)
    gl.bindVertexArray(this.quad)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  dispose() {
    const gl = this.gl
    this.buffers.forEach((b) => gl.deleteBuffer(b))
    // The context itself stays alive: the same canvas may be handed a new field
    gl.deleteVertexArray(this.quad)
  }
}
