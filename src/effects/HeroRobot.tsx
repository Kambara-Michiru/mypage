// ヒーローの「あいさつするロボット」
// モデル：RobotExpressive（Tomás Laulhé / Quaternius、改変 Don McCurdy、CC0）
// three.js の webgl_animation_skinning_morph と同じモデル・同じクロスフェードの考え方で、
// HRI の非言語手がかり（視線・しぐさ・間）をふるまいとして組んでいる。
//
//   来訪時        … こちらを向いて手を振る
//   カーソル      … 頭がそっと目で追う（スマホはタッチした場所）
//   「見る」ナビ  … 研究=うなずき / AI・開発=グッド / メディア=ジャンプ / 執筆=手を振る
//   画面の外へ    … 少しさみしい顔。戻ると驚いて、また手を振る
//   クリック      … ぴょんと跳ねる（右下にいるときは、ページの先頭へ戻る）
//   ヒーローを離れる … 右下に小さく移り、ずっとそばにいる（邪魔をしない大きさで）
//   「これから」  … 3D の物語のほうを向いて、静かに見守る
//   連絡先まで来る … 手を振って見送る
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, useAnimations, useGLTF } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import robotUrl from './assets/robot.glb?url'

export type RobotBus = {
  /** 外（ナビのホバーなど）からしぐさを頼む */
  emote: (name: Emote) => void
  /** 右下に小さく移っているか */
  docked: boolean
  /** 「これから」の3Dを見守っているか */
  watching: boolean
  /** ロボットから見たカーソルの方向（-1〜1）。ページのどこにカーソルがあっても目で追う */
  look: { x: number; y: number }
  /** スクロールの速さ（px/s）と最後にスクロールした時刻。頭ではなく体と腕で受け止める */
  scroll: { v: number; t: number }
  /** クリックされたとき（右下にいるときはページ先頭へ） */
  onClick?: () => void
  _listener?: (name: Emote) => void
}
export type Emote = 'Wave' | 'Yes' | 'No' | 'ThumbsUp' | 'Jump'

// やわらかい配色（サイトのトークンを淡くしたもの）
const PALETTE = {
  Main: '#F6C3AE', // 本体：ピーチ
  Grey: '#FBF3EA', // 関節・顔まわり：ミルク
  Black: '#3A302A', // 目：インクブラウン（真っ黒にしない）
}
const CHEEK = '#F29A8E'

const ONCE = new Set(['Wave', 'Yes', 'No', 'ThumbsUp', 'Jump'])

function Robot({ bus, still }: { bus: RobotBus; still: boolean }) {
  const group = useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(robotUrl)
  const { actions, mixer } = useAnimations(animations, group)
  const body = useRef<THREE.Group>(null)
  const lastHover = useRef(0)

  const current = useRef<THREE.AnimationAction | null>(null)
  const base = useRef<'Idle'>('Idle')
  const busy = useRef(false) // しぐさの途中
  const away = useRef(false) // カーソルが画面外
  const lastEmote = useRef(0)

  // 頭（視線）と表情
  const head = useMemo(() => {
    let bone: THREE.Bone | undefined
    let face: THREE.Mesh | undefined
    const arms: { upper: THREE.Bone; hand?: THREE.Bone }[] = []
    const bones: Record<string, THREE.Bone> = {}
    scene.traverse((o) => {
      if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone
      if ((o as THREE.Bone).isBone && o.name === 'Head') bone = o as THREE.Bone
      const m = o as THREE.Mesh
      if (m.isMesh && m.morphTargetDictionary && 'Sad' in m.morphTargetDictionary) face = m
    })
    for (const side of ['L', 'R']) {
      // three.js は骨の名前から「.」を取り除く（UpperArm.L → UpperArmL）
      const get = (n: string) => bones[`${n}${side}`] ?? bones[`${n}.${side}`]
      const upper = get('UpperArm')
      if (upper) arms.push({ upper, hand: get('Hand') ?? get('LowerArm') })
    }
    return { bone, face, arms }
  }, [scene])

  // 色をやわらかく。マットで少しだけつや
  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      m.castShadow = true
      const mats = Array.isArray(m.material) ? m.material : [m.material]
      mats.forEach((mat) => {
        const sm = mat as THREE.MeshStandardMaterial
        const c = PALETTE[sm.name as keyof typeof PALETTE]
        if (c) sm.color.set(c)
        sm.metalness = 0
        sm.roughness = sm.name === 'Black' ? 0.25 : 0.62
        sm.envMapIntensity = 0.7
      })
    })
  }, [scene])

  // ほっぺ：最初のフレームで、目のすぐ下の顔の表面にレイを当てて貼る
  const cheeksDone = useRef(false)
  const frames = useRef(0)
  function placeCheeks() {
    const bone = head.bone
    if (!bone) return
    let root: THREE.Object3D = scene
    while (root.parent) root = root.parent
    root.updateMatrixWorld(true)
    const q = new THREE.Quaternion()
    scene.getWorldQuaternion(q)
    const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(q)
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(q)
    const up = new THREE.Vector3(0, 1, 0)

    // 頭のメッシュの頂点をワールド座標で集める（目＝Black と、肌＝それ以外）
    const black: THREE.Vector3[] = []
    const skin: THREE.Vector3[] = []
    const v = new THREE.Vector3()
    bone.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const name = (Array.isArray(m.material) ? m.material[0] : m.material).name
      const pos = m.geometry.attributes.position
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld)
        ;(name === 'Black' ? black : skin).push(v.clone())
      }
    })
    if (!black.length || !skin.length) return
    const skinBox = new THREE.Box3().setFromPoints(skin)
    const mid = skinBox.getCenter(new THREE.Vector3())
    const eyesIn = black.filter((p) => p.y > skinBox.min.y && p.y < skinBox.max.y)

    const mat = new THREE.MeshBasicMaterial({ color: CHEEK, transparent: true, opacity: 0.7, depthWrite: false })
    for (const side of [-1, 1]) {
      const pts = eyesIn.filter((p) => Math.sign(p.clone().sub(mid).dot(right)) === side)
      if (pts.length < 4) continue
      const ys = pts.map((p) => p.y).sort((x, y) => x - y)
      const cut = ys[Math.floor(ys.length * 0.7)] // 上のほう（眉）を除く
      const eye = pts.filter((p) => p.y <= cut)
      const box = new THREE.Box3().setFromPoints(eye)
      const c = box.getCenter(new THREE.Vector3())
      const er = (box.max.y - box.min.y) / 2
      const target = c.clone().addScaledVector(right, -side * er * 0.15)
      target.y = box.min.y - er * 0.28 // 目のすぐ下
      // 目標の近くで、いちばん手前にある顔の頂点を探す
      let best: THREE.Vector3 | undefined
      let bestF = -Infinity
      for (const p of skin) {
        const d = p.clone().sub(target)
        const lateral = Math.hypot(d.dot(right), d.dot(up))
        if (lateral > er * 0.9) continue
        const f = p.dot(fwd)
        if (f > bestF) {
          bestF = f
          best = p
        }
      }
      if (!best) continue
      const cheek = new THREE.Mesh(new THREE.CircleGeometry(er * 0.5, 32), mat)
      cheek.position.copy(target).addScaledVector(fwd, best.dot(fwd) - target.dot(fwd) + er * 0.04)
      // 頭の丸みに沿わせる（頭の中心軸から外向き）
      const radial = cheek.position.clone().sub(mid)
      radial.y = 0
      radial.normalize().lerp(fwd, 0.35).normalize()
      cheek.lookAt(cheek.position.clone().add(radial))
      cheek.scale.set(1, 0.66, 1)
      cheek.renderOrder = 2
      root.add(cheek) // いったんワールド座標のまま置き、
      bone.attach(cheek) // 頭の子にする（頭と一緒に動く）
    }
  }

  function fadeTo(name: string, dur = 0.4) {
    const next = actions[name]
    if (!next) return
    const prev = current.current
    if (prev && prev !== next) prev.fadeOut(dur)
    next.reset()
    if (ONCE.has(name)) {
      next.setLoop(THREE.LoopOnce, 1)
      next.clampWhenFinished = true
    }
    next.setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(dur).play()
    current.current = next
  }

  function emote(name: Emote) {
    if (still) return
    const now = performance.now()
    if (busy.current && now - lastEmote.current < 900) return
    busy.current = true
    lastEmote.current = now
    fadeTo(name, 0.2)
  }

  // しぐさが終わったら元の状態へ
  useEffect(() => {
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      busy.current = false
      fadeTo(base.current, 0.25)
    }
    mixer.addEventListener('finished', onFinished as never)
    return () => mixer.removeEventListener('finished', onFinished as never)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixer, actions])

  // 登場：立って、少し間をおいて手を振る
  useEffect(() => {
    fadeTo('Idle', 0)
    if (still) return
    const t = setTimeout(() => emote('Wave'), 700)
    bus._listener = emote
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actions])

  // カーソルが画面から出た／戻った
  useEffect(() => {
    if (still) return
    const out = (e: MouseEvent) => {
      if (!e.relatedTarget) away.current = true
    }
    const back = () => {
      if (!away.current) return
      away.current = false
      surprise.current = 1
      setTimeout(() => emote('Wave'), 350)
    }
    document.addEventListener('mouseout', out)
    document.addEventListener('mouseover', back)
    return () => {
      document.removeEventListener('mouseout', out)
      document.removeEventListener('mouseover', back)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const surprise = useRef(0)
  const look = useMemo(
    () => ({ yaw: 0, pitch: 0, q: new THREE.Quaternion(), e: new THREE.Euler(), parentQ: new THREE.Quaternion(), worldQ: new THREE.Quaternion() }),
    [],
  )

  // スクロールを受け止める「ばね」：体の前後の傾きと、腕の開き
  const sway = useMemo(
    () => ({ lean: 0, leanV: 0, arm: 0, armV: 0, q: new THREE.Quaternion(), pq: new THREE.Quaternion(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), axis: new THREE.Vector3() }),
    [],
  )

  useFrame((state, dt) => {
    const now = performance.now()
    const scrolling = now - bus.scroll.t < 400
    // ---- スクロール：頭は動かさず、体がふわっと傾いて腕でバランスをとる ----
    if (!still) {
      const sv = now - bus.scroll.t < 180 ? THREE.MathUtils.clamp(bus.scroll.v / 1500, -1, 1) : 0
      // 減衰の弱いばね → 止まったあと一、二度ゆれて戻る。
      // フレームの間隔に左右されないよう、細かく刻んで積分する
      const k = 60, c = 7
      let rest = Math.min(dt, 0.25)
      while (rest > 0) {
        const h = Math.min(rest, 1 / 120)
        sway.leanV += (k * (sv * 0.16 - sway.lean) - c * sway.leanV) * h
        sway.lean += sway.leanV * h
        sway.armV += (k * 0.8 * (Math.abs(sv) * 0.5 - sway.arm) - c * sway.armV) * h
        sway.arm += sway.armV * h
        rest -= h
      }
    }

    // 行列が確定してから（数フレーム後に）貼る
    frames.current++
    if (!cheeksDone.current && frames.current === 4) {
      cheeksDone.current = true
      placeCheeks()
    }
    // 「これから」の3Dを見守るときは、体ごとそちら（左）を向く
    if (body.current) {
      const target = bus.watching ? -0.85 : -0.28
      body.current.rotation.y = THREE.MathUtils.damp(body.current.rotation.y, target, 2, dt)
      // 足もとを支点に前後へ傾く（下へスクロール＝ページが上へ流れる → 慣性で後ろへ）
      body.current.rotation.x = sway.lean
    }
    // 腕：肩から手への向きを、体の外側へ少し持ち上げる（両手でバランスをとるしぐさ）
    if (Math.abs(sway.arm) > 0.001 && head.arms.length) {
      const center = sway.c
      body.current?.getWorldPosition(center)
      for (const { upper, hand } of head.arms) {
        if (!hand || !upper.parent) continue
        upper.getWorldPosition(sway.a)
        hand.getWorldPosition(sway.b)
        const dir = sway.b.sub(sway.a).normalize() // 肩→手
        const out = sway.a.clone().sub(center)
        out.y = 0
        if (out.lengthSq() < 1e-6) continue
        out.normalize()
        sway.axis.crossVectors(dir, out).normalize()
        sway.q.setFromAxisAngle(sway.axis, sway.arm)
        upper.parent.getWorldQuaternion(sway.pq)
        const wq = sway.pq.clone().multiply(upper.quaternion).premultiply(sway.q)
        upper.quaternion.copy(sway.pq.invert().multiply(wq))
        upper.updateMatrixWorld(true)
      }
    }

    // 視線：頭をカーソルのほうへ（ミキサーが姿勢を決めたあとに足す）
    // 角度は小さく（左右±15°・上下±7°）、ゆっくり追う。人がちらっと目をやる程度に。
    // 回転は「世界の上下軸・左右軸」まわりで足す（骨のローカル軸だと姿勢によってひねれるため）
    if (head.bone && head.bone.parent) {
      const MAX_YAW = 0.26
      const MAX_PITCH = 0.12
      const quiet = away.current || bus.watching
      const tYaw = quiet ? 0 : THREE.MathUtils.clamp(bus.look.x * MAX_YAW, -MAX_YAW, MAX_YAW)
      const tPitch = away.current ? 0.08 : bus.watching ? 0 : THREE.MathUtils.clamp(-bus.look.y * MAX_PITCH, -MAX_PITCH, MAX_PITCH)
      const idleLook = still ? 0 : Math.sin(state.clock.elapsedTime * 0.35) * 0.03
      // スクロール中は視線を止める（頭は動かさない）
      if (!scrolling) {
        look.yaw = THREE.MathUtils.damp(look.yaw, tYaw + idleLook, 2.5, dt)
        look.pitch = THREE.MathUtils.damp(look.pitch, tPitch, 2.5, dt)
      }
      head.bone.parent.getWorldQuaternion(look.parentQ)
      look.worldQ.copy(look.parentQ).multiply(head.bone.quaternion) // 今の頭の向き（世界）
      look.e.set(look.pitch, look.yaw, 0, 'YXZ')
      look.q.setFromEuler(look.e)
      look.worldQ.premultiply(look.q) // 世界軸で少しだけ回す
      head.bone.quaternion.copy(look.parentQ.invert().multiply(look.worldQ))
    }

    // 表情：画面外ならさみしい顔、戻ると一瞬おどろく
    if (head.face?.morphTargetInfluences && head.face.morphTargetDictionary) {
      const d = head.face.morphTargetDictionary
      const inf = head.face.morphTargetInfluences
      surprise.current = Math.max(0, surprise.current - dt * 1.4)
      inf[d.Sad] = THREE.MathUtils.damp(inf[d.Sad], away.current ? 0.85 : 0, 4, dt)
      inf[d.Surprised] = surprise.current
      if (inf[d.Angry] !== undefined) inf[d.Angry] = 0
    }
  })

  // 中心合わせ（足元を原点に）
  const fitted = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const h = box.max.y - box.min.y
    return { y: -box.min.y, s: 2.6 / h }
  }, [scene])

  return (
    <group ref={group} dispose={null}>
      <group
        ref={body}
        scale={fitted.s}
        position={[0, fitted.y * fitted.s, 0]}
        rotation={[0, -0.28, 0]}
        onClick={(e) => {
          e.stopPropagation()
          surprise.current = 1
          emote('Jump')
          bus.onClick?.()
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer'
          // 近づくと小さく手を振る（何度も繰り返さない）
          const now = performance.now()
          if (now - lastHover.current > 6000) {
            lastHover.current = now
            emote('Wave')
          }
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <primitive object={scene} />
      </group>
    </group>
  )
}

function Frame() {
  // 高さ 2.6 のロボットが箱に収まるようにカメラを合わせる
  const { camera, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const fitH = 3.3 / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
    const fitW = 2.2 / aspect / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
    cam.position.set(0.4, 1.5, Math.max(fitH, fitW))
    cam.lookAt(0, 1.28, 0)
    cam.updateProjectionMatrix()
  }, [camera, size])
  return null
}

export default function HeroRobot({ bus, still }: { bus: RobotBus; still: boolean }) {
  // ずっと表示するので、止めるのはタブが裏にあるときだけ
  const [active, setActive] = useState(true)
  useEffect(() => {
    const on = () => setActive(!document.hidden)
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  const mobile = window.matchMedia('(max-width: 760px)').matches
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 30, near: 0.1, far: 50, position: [0, 1.5, 7] }}
      dpr={mobile ? [1, 1.75] : [1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <Frame />
      <hemisphereLight args={['#FFF8F0', '#E9C9B6', 1.4]} />
      {/* 光源は左上（書斎の窓）。サイト全体で同じ向き */}
      <directionalLight position={[-4, 5, 4]} intensity={1.6} color="#FFF1E4" />
      <Environment resolution={64}>
        <Lightformer intensity={1.6} position={[0, 4, 3]} scale={[8, 4, 1]} color="#FFF6EC" />
        <Lightformer intensity={0.9} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} color="#F4B9A0" />
      </Environment>
      <Robot bus={bus} still={still} />
      <ContactShadows position={[0, 0, 0]} opacity={0.32} scale={4} blur={2.6} far={3} resolution={256} color="#8A5A44" />
    </Canvas>
  )
}

useGLTF.preload(robotUrl)
