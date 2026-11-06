import { useEffect, useRef } from 'react'

// Molten ink behind the closing section: a dark crust with veins of deep red,
// magma and ember that slowly churn. Drawn at a quarter of the screen's pixels
// (the softness is the look), and only while the section is on screen.

const VERT = `attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`
const FRAG = `
precision mediump float;
uniform vec2 res; uniform float t;
// Ink crust, deep red, magma, ember (the site's own palette)
const vec3 INK = vec3(0.129, 0.145, 0.161);
const vec3 DEEP = vec3(0.70, 0.15, 0.12);
const vec3 MAGMA = vec3(0.965, 0.267, 0.055);
const vec3 EMBER = vec3(1.0, 0.70, 0.22);
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * res) / res.y;
  uv *= 1.6;
  // Swirl the space over itself again and again: the lava folds and stretches
  float k = t * 0.18;
  for (float i = 1.0; i < 9.0; i++) {
    uv.x += 0.55 / i * sin(i * 1.7 * uv.y + k + i * 0.9);
    uv.y += 0.45 / i * cos(i * 1.3 * uv.x - k * 0.8 + i * 1.7);
  }
  float f = sin(uv.x * 1.4 + uv.y * 0.8 + k * 0.6);
  // Veins where the field crosses zero; the thinnest cores burn brightest
  float vein = 1.0 - smoothstep(0.0, 0.55, abs(f));
  float core = 1.0 - smoothstep(0.0, 0.12, abs(f));
  vec3 col = INK;
  col = mix(col, DEEP, vein * 0.55);
  col = mix(col, MAGMA, pow(vein, 2.6) * 0.75);
  col = mix(col, EMBER, core * 0.55);
  // Darker toward the top, where the words are
  vec2 q = gl_FragCoord.xy / res;
  col = mix(INK, col, smoothstep(1.05, 0.15, q.y) * 0.9 + 0.1);
  gl_FragColor = vec4(col, 1.0);
}
`

export function Lava() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current!
    const gl = c.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
    if (!gl) return
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const at = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(at)
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'res')
    const uT = gl.getUniformLocation(prog, 't')

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches
    const size = () => {
      // Half resolution each way: a quarter of the pixels, and the lava is soft anyway
      c.width = Math.max(1, Math.round(c.clientWidth * 0.5))
      c.height = Math.max(1, Math.round(c.clientHeight * 0.5))
      gl.viewport(0, 0, c.width, c.height)
      gl.uniform2f(uRes, c.width, c.height)
    }
    let raf = 0
    let on = false
    const t0 = performance.now()
    const draw = () => {
      gl.uniform1f(uT, still ? 12 : (performance.now() - t0) / 1000)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      if (on && !still) raf = requestAnimationFrame(draw)
    }
    const ro = new ResizeObserver(() => {
      size()
      if (!on || still) draw()
    })
    ro.observe(c)
    const io = new IntersectionObserver(([e]) => {
      const was = on
      on = !!e?.isIntersecting
      if (on && !was) raf = requestAnimationFrame(draw)
      if (!on) cancelAnimationFrame(raf)
    })
    io.observe(c)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
    }
  }, [])

  return <canvas ref={ref} className="lava" aria-hidden="true" />
}
