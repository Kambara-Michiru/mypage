// ヒーローの「見る」ナビを Liquid Glass（dashersw/liquid-glass-js）に載せる。
//
// 本家はページ全体を html2canvas で一度だけ撮影して屈折させるが、
// ここでは背景が動くグラデーションなので、撮影の代わりに
// 「グラデーションのキャンバス＋ヴェール」をページ座標のキャンバスへ毎フレーム描き、
// それをガラスのテクスチャとして流し込む。html2canvas は不要になる。
import { Container } from '../vendor/liquid-glass.js'

type GlassRefs = { gl: WebGLRenderingContext; texture: WebGLTexture; textureSizeLoc: WebGLUniformLocation }
type GlassInstance = {
  element: HTMLDivElement
  canvas: HTMLCanvasElement
  gl_refs: Partial<GlassRefs>
  render?: () => void
  updateSizeFromDOM: () => void
}

const VEIL = 'rgba(250, 246, 240, 0.78)' // .hero-veil と同じ値（effects.css）

export function mountHeroGlass(hero: HTMLElement, explore: HTMLElement, still: boolean) {
  const gradientCanvas = () => hero.querySelector<HTMLCanvasElement>('.hero-light canvas')

  // ページ座標のスナップショット（ヒーロー部分だけ描けば足りる）
  const snap = document.createElement('canvas')
  const ctx = snap.getContext('2d')!

  function paint() {
    const w = document.documentElement.clientWidth
    const r = hero.getBoundingClientRect()
    const top = r.top + window.scrollY
    const h = Math.ceil(top + r.height)
    if (snap.width !== w || snap.height !== h) {
      snap.width = w
      snap.height = h
    }
    ctx.fillStyle = '#FAF6F0'
    ctx.fillRect(0, 0, w, h)
    const src = gradientCanvas()
    if (src && src.width > 0) ctx.drawImage(src, r.left, top, r.width, r.height)
    // 文字を読みやすくするヴェール（CSS と同じ形）
    const g = ctx.createLinearGradient(r.left, 0, r.left + r.width, 0)
    g.addColorStop(0, VEIL)
    g.addColorStop(0.55, 'rgba(250, 246, 240, 0.35)')
    g.addColorStop(1, 'rgba(250, 246, 240, 0)')
    ctx.fillStyle = g
    ctx.fillRect(r.left, top, r.width, r.height)
    // 下端は紙へにじむ（CSS の mask と同じ位置）
    const f = ctx.createLinearGradient(0, top + r.height * 0.68, 0, top + r.height)
    f.addColorStop(0, 'rgba(250, 246, 240, 0)')
    f.addColorStop(1, 'rgba(250, 246, 240, 1)')
    ctx.fillStyle = f
    ctx.fillRect(r.left, top + r.height * 0.68, r.width, r.height * 0.32)
  }

  paint()
  ;(Container as unknown as { pageSnapshot: HTMLCanvasElement }).pageSnapshot = snap

  const glass = new (Container as unknown as new (o: object) => GlassInstance)({
    type: 'rounded',
    borderRadius: 30,
    tintOpacity: 0.12,
  })
  glass.element.classList.add('hero-glass')
  glass.canvas.style.boxShadow = '0 18px 40px rgba(120, 72, 44, 0.14), 0 1px 0 rgba(255,255,255,.6) inset'

  // 既存の <nav class="hero-explore">（本物のリンク）をそのままガラスの中へ移す
  explore.parentElement!.insertBefore(glass.element, explore)
  glass.element.appendChild(explore)
  explore.classList.add('is-glass')
  glass.updateSizeFromDOM()

  // JA/EN 切替や画面幅でサイズが変わったら追従
  new ResizeObserver(() => glass.updateSizeFromDOM()).observe(explore)

  // テクスチャを差し替えて再描画
  function upload() {
    const refs = glass.gl_refs
    if (!refs.gl || !refs.texture) return
    const gl = refs.gl
    paint()
    gl.bindTexture(gl.TEXTURE_2D, refs.texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, snap)
    if (refs.textureSizeLoc) gl.uniform2f(refs.textureSizeLoc, snap.width, snap.height)
    glass.render?.()
  }

  let visible = true
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero)

  let last = 0
  function loop(t: number) {
    // 動きはゆっくりなので 20fps で十分
    if (visible && !document.hidden && t - last > 50) {
      last = t
      upload()
    }
    requestAnimationFrame(loop)
  }

  if (still) {
    // 動きを減らす設定：グラデーションが描けたら一度だけ取り込む
    setTimeout(upload, 600)
    window.addEventListener('resize', () => setTimeout(upload, 200))
  } else {
    requestAnimationFrame(loop)
  }
}
