// 既存の静的ページ（index.html / styles.css / script.js）はそのまま。
// ここでは WebGL のエフェクトだけを「島」として後から差し込む。
// WebGL が使えない環境では何もせず、元のページがそのまま表示される。
import { createRoot } from 'react-dom/client'
import { lazy, Suspense, type ComponentType } from 'react'
import './effects.css'
import type { Progress } from './VisionScene'
import type { RobotBus, Emote } from './HeroRobot'

const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function webglOK() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function toHex(rgb: string) {
  const m = rgb.match(/\d+(\.\d+)?/g)
  if (!m || (m.length === 4 && Number(m[3]) === 0)) return '#FAF6F0'
  return '#' + m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('')
}

function mount<P extends object>(el: Element, load: () => Promise<{ default: ComponentType<P> }>, props: P) {
  const C = lazy(load)
  createRoot(el).render(
    <Suspense fallback={null}>
      <C {...props} />
    </Suspense>,
  )
}

// 画面に近づいたら一度だけ読み込む
function whenNear(el: Element, fn: () => void, margin = '600px') {
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect()
        fn()
      }
    },
    { rootMargin: margin },
  )
  io.observe(el)
}

function hero() {
  const hero = document.querySelector<HTMLElement>('.hero')
  const explore = document.querySelector<HTMLElement>('.hero-explore')
  if (!hero) return
  const light = document.createElement('div')
  light.className = 'hero-light'
  light.setAttribute('aria-hidden', 'true')
  const veil = document.createElement('div')
  veil.className = 'hero-veil'
  veil.setAttribute('aria-hidden', 'true')
  hero.prepend(veil)
  hero.prepend(light)
  mount(light, () => import('./HeroLight'), { still })

  // グラデーションの最初の描画を待ってからガラスを載せる
  if (explore) {
    const start = () =>
      import('./heroGlass').then(({ mountHeroGlass }) => {
        try {
          mountHeroGlass(hero, explore, still)
        } catch (e) {
          console.warn('[glass] skipped:', e)
        }
      })
    const wait = () => {
      const c = light.querySelector('canvas')
      if (c && c.width > 0) setTimeout(start, 400)
      else setTimeout(wait, 120)
    }
    wait()
  }
}

// ヒーローの「あいさつするロボット」
function robot() {
  const hero = document.querySelector<HTMLElement>('.hero')
  const title = hero?.querySelector<HTMLElement>('.hero-title')
  const lead = hero?.querySelector<HTMLElement>('.hero-lead')
  const marquee = hero?.querySelector<HTMLElement>('.hero-marquee')
  if (!hero || !title || !lead) return

  const box = document.createElement('div')
  box.className = 'hero-robot'
  box.setAttribute('aria-hidden', 'true')
  hero.append(box)

  // 置き場所：PCは「見出しの下・本文の右」の空き、スマホは見出しの上。
  // ヒーローを離れたら右下に小さく移る（docked）。
  const place = () => {
    if (box.classList.contains('docked')) return
    const h = hero.getBoundingClientRect()
    const t = title.getBoundingClientRect()
    const l = lead.getBoundingClientRect()
    const nav = hero.querySelector<HTMLElement>('.hero-glass, .hero-explore')?.getBoundingClientRect()
    const m = marquee?.getBoundingClientRect()
    const left = Math.max(l.right, nav?.right ?? 0) + 16 - h.left
    const width = h.width - left - 8
    const mobile = window.innerWidth <= 760 || width < 260
    hero.classList.toggle('robot-top', mobile)
    if (mobile) {
      box.removeAttribute('style')
      return
    }
    const top = t.bottom - h.top + 8
    const bottom = (m ? m.top : h.bottom) - h.top
    Object.assign(box.style, {
      left: `${left}px`,
      width: `${Math.min(width, 560)}px`,
      top: `${top}px`,
      height: `${Math.max(320, bottom - top)}px`,
    })
  }
  place()
  setTimeout(place, 1200) // 見出しのフェードイン後に測り直す
  new ResizeObserver(place).observe(hero)
  window.addEventListener('resize', place)

  const bus: RobotBus = {
    docked: false,
    watching: false,
    look: { x: 0, y: 0 },
    emote: (n) => bus._listener?.(n),
    // 右下にいるときのクリックは「ページの先頭へ」
    onClick: () => {
      if (bus.docked) window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' })
    },
  }

  // ヒーローを離れたら右下へ、戻ったらヒーローへ（行き来がちらつかないよう幅を持たせる）
  const dock = (on: boolean) => {
    if (on === bus.docked) return
    bus.docked = on
    if (on) {
      box.removeAttribute('style')
      box.classList.add('docked')
    } else {
      box.classList.remove('docked', 'watching', 'is-scrolling')
      bus.watching = false
      place()
    }
  }
  new IntersectionObserver(
    ([e]) => {
      if (e.intersectionRatio < 0.3) dock(true)
      else if (e.intersectionRatio > 0.45) dock(false)
    },
    { threshold: [0, 0.15, 0.3, 0.45, 0.6, 1] },
  ).observe(hero)

  // 「これから」の3Dが見えている間は、そちらを向いて静かに見守る（主役をゆずる）
  const stage = () => document.querySelector('#vision .vision-flow')
  const watchIO = new IntersectionObserver(([e]) => {
    bus.watching = bus.docked && e.isIntersecting
    box.classList.toggle('watching', bus.watching)
  }, { rootMargin: '-25% 0px -25% 0px' })
  const tryWatch = () => (stage() ? watchIO.observe(stage()!) : setTimeout(tryWatch, 500))
  tryWatch()

  // 連絡先まで来たら、一度だけ手を振って見送る
  const footer = document.querySelector('.site-footer')
  if (footer) {
    let waved = false
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !waved) {
        waved = true
        bus.emote('Wave')
      } else if (!e.isIntersecting) waved = false
    }, { threshold: 0.4 }).observe(footer)
  }

  // ページのどこにカーソルがあっても、ロボットから見た方向で目で追う
  window.addEventListener(
    'pointermove',
    (e) => {
      const r = box.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.3
      bus.look.x = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.5)))
      bus.look.y = Math.max(-1, Math.min(1, -(e.clientY - cy) / (window.innerHeight * 0.5)))
    },
    { passive: true },
  )

  // スクロール中は薄くなり、止まると戻る（読むのを邪魔しない）
  let t = 0
  window.addEventListener(
    'scroll',
    () => {
      if (!bus.docked) return
      box.classList.add('is-scrolling')
      clearTimeout(t)
      t = window.setTimeout(() => box.classList.remove('is-scrolling'), 450)
    },
    { passive: true },
  )

  // 「見る」ナビにふれると、しぐさで応える
  const gestures: Record<string, Emote> = { '#path': 'Yes', '#work': 'ThumbsUp', '#media': 'Jump', '#writing': 'Wave' }
  hero.querySelectorAll<HTMLAnchorElement>('.hero-explore a').forEach((a) => {
    const g = gestures[a.getAttribute('href') ?? '']
    if (!g) return
    a.addEventListener('mouseenter', () => bus.emote(g))
    a.addEventListener('focus', () => bus.emote(g))
  })

  mount(box, () => import('./HeroRobot'), { bus, still })
}

function vision() {
  const section = document.querySelector<HTMLElement>('#vision')
  const flow = section?.querySelector<HTMLElement>('.vision-flow')
  if (!section || !flow) return

  // 段落リストの横（スマホでは上）に、スクロールに固定される舞台を置く
  const wrap = document.createElement('div')
  wrap.className = 'vision-stage-wrap'
  flow.parentElement!.insertBefore(wrap, flow)
  const stage = document.createElement('div')
  stage.className = 'vision-stage'
  stage.setAttribute('aria-hidden', 'true')
  wrap.append(stage, flow)
  section.classList.add('has-stage')
  const bg = toHex(getComputedStyle(section).backgroundColor)
  section.style.setProperty('--stage-bg', bg)

  const progress: Progress = { current: 0 }
  const update = () => {
    const r = flow.getBoundingClientRect()
    const focus = window.innerHeight * 0.55 // 画面のこの高さを通過した量で進める
    progress.current = Math.min(1, Math.max(0, (focus - r.top) / r.height))
    // 今読んでいる段落を強調
    const beats = flow.querySelectorAll<HTMLElement>('.vision-beat')
    const i = Math.min(beats.length - 1, Math.floor(progress.current * beats.length))
    beats.forEach((b, j) => b.classList.toggle('is-current', j === i))
  }
  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)

  whenNear(section, () => mount(stage, () => import('./VisionScene'), { progress, bg }))
}

if (webglOK()) {
  document.documentElement.classList.add('fx')
  hero()
  robot()
  vision()
}
