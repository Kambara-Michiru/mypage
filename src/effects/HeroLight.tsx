// ヒーロー背景：「縦溝ガラス（フルーテッドガラス）越しの光」
// やわらかい色の光の塊がゆっくり漂い、それを横に刻まれたガラスの畝（うね）越しに見る。
// 畝ごとに像が反転・圧縮され、明るいところには細い反射の筋が走る。
// 依存なしの素の WebGL。Liquid Glass がこのキャンバスを読むので preserveDrawingBuffer を付ける。
import { useEffect, useRef } from 'react'

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2 uRes;      // 描画バッファの大きさ（px）
uniform float uTime;
uniform vec2 uPointer;  // 0..1（左下原点）
uniform float uBand;    // 畝の太さ（px）
uniform float uDpr;

// サイトの色：生成り・光（暖/寒）に、奥行きのための少し深い色
const vec3 CREAM = vec3(0.980, 0.965, 0.941);
const vec3 PEACH = vec3(0.949, 0.757, 0.651);
const vec3 TERRA = vec3(0.871, 0.561, 0.447);
const vec3 ROSE  = vec3(0.906, 0.663, 0.627);
const vec3 SKY   = vec3(0.718, 0.773, 0.824);
const vec3 SLATE = vec3(0.400, 0.447, 0.522);

float blob(vec2 p, vec2 c, float r){ vec2 d = p - c; return exp(-dot(d, d) / (r * r)); }

// ガラスの向こうの景色
vec3 scene(vec2 uv){
  float a = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * a, uv.y);
  float t = uTime;
  vec3 col = mix(CREAM, PEACH, 0.35);
  col = mix(col, PEACH, 0.80 * blob(p, vec2(a * (0.28 + 0.10 * sin(t * 0.13)), 0.62 + 0.10 * cos(t * 0.11)), 0.42));
  col = mix(col, TERRA, 0.95 * blob(p, vec2(a * (0.60 + 0.12 * sin(t * 0.09 + 1.3)), 0.42 + 0.16 * sin(t * 0.12)), 0.26));
  col = mix(col, SLATE, 0.85 * blob(p, vec2(a * (0.78 + 0.08 * cos(t * 0.10)), 0.68 + 0.12 * sin(t * 0.14 + 2.0)), 0.20));
  col = mix(col, SKY,   0.85 * blob(p, vec2(a * (0.93 + 0.06 * sin(t * 0.07)), 0.28 + 0.14 * cos(t * 0.09)), 0.24));
  col = mix(col, ROSE,  0.70 * blob(p, vec2(a * (0.44 + 0.12 * cos(t * 0.08 + 0.7)), 0.16 + 0.08 * sin(t * 0.10)), 0.22));
  col = mix(col, TERRA, 0.55 * blob(p, vec2(a * (0.98 + 0.05 * cos(t * 0.06)), 0.82 + 0.06 * sin(t * 0.11)), 0.18));
  return col;
}

// ガラスに映り込む光の点（ここにだけ白い筋が走る）
float hot(vec2 uv){
  float a = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * a, uv.y);
  float t = uTime;
  float h = blob(p, vec2(a * (0.42 + 0.10 * sin(t * 0.11)), 0.80 + 0.06 * cos(t * 0.09)), 0.10);
  h += blob(p, vec2(a * (0.70 + 0.10 * cos(t * 0.08 + 1.0)), 0.30 + 0.10 * sin(t * 0.10)), 0.09);
  h += 0.8 * blob(p, vec2(a * (0.88 + 0.05 * sin(t * 0.12 + 2.0)), 0.55 + 0.08 * cos(t * 0.07)), 0.07);
  h += 0.9 * blob(p, vec2(uPointer.x * a, uPointer.y), 0.11); // カーソルの光
  return h;
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main(){
  vec2 frag = gl_FragCoord.xy;
  float band = uBand;
  float fy = frag.y / band;
  float id = floor(fy);
  float f = fract(fy) - 0.5;            // 畝の中の位置（-0.5..0.5）

  // 畝ごとにレンズの強さを少しずつ変える（揃いすぎない、手づくりのガラス）
  float k = -2.6 + 1.1 * sin(id * 0.37 + uTime * 0.05) + 0.5 * sin(frag.x / (240.0 * uDpr) + id * 0.11);
  float sy = (id + 0.5) * band + f * band * k;
  // 畝の縁ほど横にずれる → 横に流れる筋になる
  float sx = frag.x + f * f * band * 6.0 * sin(id * 0.7 + uTime * 0.04);

  // 横方向にぼかしてガラスのにじみを出す（色ごとに少しずらして虹色のふち）
  vec3 col = vec3(0.0);
  float spread = 14.0 * uDpr;
  float ca = f * band * 0.35;
  for (int i = -2; i <= 2; i++) {
    float ox = float(i) * spread;
    col.r += scene(vec2(sx + ox + ca, sy + ca) / uRes).r;
    col.g += scene(vec2(sx + ox, sy) / uRes).g;
    col.b += scene(vec2(sx + ox - ca, sy - ca) / uRes).b;
  }
  col /= 5.0;

  // 光の点のところだけに走る細い反射の筋（横にぼかして尾を引かせる）
  float h = 0.0;
  for (int i = -2; i <= 2; i++) h += hot(vec2(sx + float(i) * spread * 1.6, sy) / uRes);
  h /= 5.0;
  float line = smoothstep(0.11, 0.0, abs(f + 0.12));
  col += vec3(1.0, 0.98, 0.95) * line * smoothstep(0.15, 0.7, h) * 0.85;
  col += vec3(1.0, 0.97, 0.93) * h * 0.18;
  // 畝の上の縁にかすかな光（ガラスの手ざわり）
  col += 0.05 * smoothstep(0.38, 0.5, f);
  // 畝の境目はわずかに沈む
  col *= 1.0 - 0.07 * smoothstep(0.32, 0.5, abs(f));
  // 紙と同じ粒子
  col += (hash(frag + fract(uTime)) - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
`

export default function HeroLight({ still }: { still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false, alpha: false })
    if (!gl) return

    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s))
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = u('uRes'), uTime = u('uTime'), uPointer = u('uPointer'), uBand = u('uBand'), uDpr = u('uDpr')

    const mobile = window.matchMedia('(max-width: 760px)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5)

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width * dpr))
      const h = Math.max(1, Math.round(r.height * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
        gl.viewport(0, 0, w, h)
      }
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uBand, (mobile ? 16 : 24) * dpr)
      gl.uniform1f(uDpr, dpr)
    }

    // カーソルの光はゆっくり追いかける
    const target = { x: 0.7, y: 0.55 }
    const pos = { ...target }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      target.x = (e.clientX - r.left) / r.width
      target.y = 1 - (e.clientY - r.top) / r.height
    }

    const t0 = performance.now() - 40_000 // 初期配置がきれいな時刻から始める
    const draw = (now: number) => {
      pos.x += (target.x - pos.x) * 0.04
      pos.y += (target.y - pos.y) * 0.04
      gl.uniform1f(uTime, (now - t0) / 1000)
      gl.uniform2f(uPointer, pos.x, pos.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      if (still) draw(performance.now())
    })
    ro.observe(canvas)

    let raf = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)

    if (still) {
      draw(performance.now())
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      const loop = (now: number) => {
        if (visible && !document.hidden) draw(now)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [still])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
}
