// 「これから — 画面から、空間へ」をスクロールで見せる 3D シーン（React Three Fiber + drei）
//
// 5つの段落に合わせて、ひとつのガラスの形が変わっていく。
//   1. 画面の中のAI      … 薄い板（スクリーン）
//   2. 注意を奪い合う画面 … 板が傾き、光が弱まる
//   3. 身体をもつ存在    … 厚みと丸みを得て、ヒーローのロボットの頭の形になる
//   4. 信頼             … ヒーローのロボットと同じ顔（目・眉・ほっぺ）が生まれ、見る人へ視線を向ける
//   5. あたたかさ        … 内側にテラコッタの灯がともる
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
import { RoundedBoxGeometry } from 'three-stdlib'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export type Progress = { current: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// 形の段階（0〜1）。スクロール量から作る
function shapeAt(p: number) {
  const body = smooth(0.38, 0.62, p) // 板→からだ
  return {
    // 最終形はヒーローのロボットの頭と同じ比率（横長・角の丸い箱）
    w: lerp(2.3, 1.75, body),
    h: lerp(1.45, 1.1, body),
    d: lerp(0.06, 1.0, body),
    r: lerp(0.03, 0.38, body),
  }
}

const LEVELS = 40 // 形状を作り直す段階数（作り直しは段階が変わったときだけ）

function Presence({ progress, quality }: { progress: Progress; quality: 'high' | 'low' }) {
  const group = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  // 両目で同じマテリアルを共有（不透明度をまとめて変える）
  // 目と眉はヒーローのロボットと同じインクブラウン、ほっぺも同じ色
  const eyeMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#3A302A', transparent: true, opacity: 0 }), [])
  const cheekMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#F29A8E', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )
  const eyeMat = useRef(eyeMaterial)
  const heart = useRef<THREE.Mesh>(null)
  const heartMat = useRef<THREE.MeshBasicMaterial>(null)
  const glow = useRef<THREE.PointLight>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const p = useRef(0)
  const level = useRef(-1)
  const { pointer } = useThree()

  const geoms = useMemo(() => new Map<number, THREE.BufferGeometry>(), [])
  useEffect(() => () => geoms.forEach((g) => g.dispose()), [geoms])

  useFrame((state, dt) => {
    // スクロール値を少し遅れて追う（なめらかさ）
    p.current = THREE.MathUtils.damp(p.current, progress.current, 4, dt)
    const x = p.current

    // 形状
    const lv = Math.round(x * LEVELS)
    if (lv !== level.current && mesh.current) {
      level.current = lv
      let g = geoms.get(lv)
      if (!g) {
        const s = shapeAt(lv / LEVELS)
        g = new RoundedBoxGeometry(s.w, s.h, s.d, 6, s.r)
        geoms.set(lv, g)
      }
      mesh.current.geometry = g
    }

    const t = state.clock.elapsedTime
    if (group.current) {
      // 2段落目：画面がそっぽを向く → 3段落目以降：こちらへ向き直る
      const away = smooth(0.15, 0.32, x) * (1 - smooth(0.4, 0.58, x))
      group.current.rotation.y = lerp(-0.35, 0.55, away) + Math.sin(t * 0.4) * 0.04
      group.current.rotation.x = -0.08 + away * 0.12
      group.current.position.y = Math.sin(t * 0.8) * 0.04 * smooth(0.5, 0.7, x)
    }

    // 4段落目：目があらわれ、ポインタのほうを見る（視線＝HRIの非言語手がかり）
    const eyeOn = smooth(0.6, 0.72, x)
    if (eyes.current && eyeMat.current) {
      eyeMat.current.opacity = eyeOn
      cheekMaterial.opacity = eyeOn * 0.7
      // 視線はヒーローのロボットと同じく控えめに
      eyes.current.position.x = THREE.MathUtils.damp(eyes.current.position.x, pointer.x * 0.05, 3, dt)
      eyes.current.position.y = THREE.MathUtils.damp(eyes.current.position.y, 0.08 + pointer.y * 0.03, 3, dt)
      // ときどき瞬き
      const blink = Math.sin(t * 1.3) > 0.985 ? 0.15 : 1
      eyes.current.scale.y = THREE.MathUtils.damp(eyes.current.scale.y, blink, 30, dt)
    }

    // 5段落目：内側の灯
    const warm = smooth(0.8, 0.95, x)
    if (heart.current && heartMat.current && glow.current) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.05 * warm
      heart.current.scale.setScalar(Math.max(0.0001, warm * 0.32 * pulse))
      heartMat.current.opacity = warm
      glow.current.intensity = warm * 6
    }
  })

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <MeshTransmissionMaterial
          samples={quality === 'high' ? 6 : 3}
          resolution={quality === 'high' ? 512 : 256}
          thickness={0.55}
          roughness={0.08}
          ior={1.4}
          chromaticAberration={0.18}
          anisotropicBlur={0.15}
          distortion={0.2}
          distortionScale={0.35}
          temporalDistortion={0.05}
          color="#FFF6EE"
          backside={quality === 'high'}
        />
      </mesh>

      {/* 顔：ヒーローのロボットと同じ（大きな丸い目・短い眉・ほっぺ） */}
      <group ref={eyes} position={[0, 0.08, 0.52]}>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            {/* 目：角ばった球（ヒーローのローポリの目と同じ質感） */}
            <mesh position={[sd * 0.36, 0, 0.03]} material={eyeMaterial}>
              <icosahedronGeometry args={[0.14, 1]} />
            </mesh>
            {/* 眉 */}
            <mesh position={[sd * 0.36, 0.24, 0.02]} rotation={[0, 0, sd * -0.08]} material={eyeMaterial}>
              <boxGeometry args={[0.26, 0.05, 0.05]} />
            </mesh>
            {/* ほっぺ */}
            <mesh position={[sd * 0.4, -0.2, 0.025]} scale={[1, 0.62, 1]} material={cheekMaterial}>
              <circleGeometry args={[0.075, 32]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 内側の灯 */}
      <mesh ref={heart} position={[0, -0.12, 0]} scale={0.0001}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial ref={heartMat} color="#E58A5E" transparent opacity={0} toneMapped={false} />
      </mesh>
      <pointLight ref={glow} position={[0, -0.1, 0]} color="#F0A070" intensity={0} distance={3} />
    </group>
  )
}

// ガラスの向こうにある「光」の玉（サイトの装飾と同じ2色）
function Backdrop({ progress }: { progress: Progress }) {
  return (
    <group position={[0, 0, -2.2]}>
      <mesh position={[-1.3, 0.55, 0]}>
        <circleGeometry args={[0.95, 64]} />
        <meshBasicMaterial color="#EDB396" />
      </mesh>
      <mesh position={[1.35, -0.6, -0.2]}>
        <circleGeometry args={[0.7, 64]} />
        <meshBasicMaterial color="#B7C5D2" />
      </mesh>
      {/* 画面時代の「通知」の光点。2段落目で強く、その後は消える */}
      <Notifications progress={progress} />
    </group>
  )
}

function Notifications({ progress }: { progress: Progress }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    const x = progress.current
    const on = smooth(0.08, 0.22, x) * (1 - smooth(0.36, 0.48, x))
    ref.current?.children.forEach((m, i) => {
      const mat = (m as THREE.Mesh).material as THREE.MeshBasicMaterial
      mat.opacity = on * (0.6 + 0.4 * Math.sin(state.clock.elapsedTime * 3 + i * 1.7))
    })
  })
  return (
    <group ref={ref}>
      {[
        [-0.2, -0.95],
        [0.25, -1.05],
        [-1.9, -0.4],
        [2.0, 0.4],
      ].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.1]}>
          <circleGeometry args={[0.07, 24]} />
          <meshBasicMaterial color="#6E8499" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  )
}

function CameraFit() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / size.height
    camera.position.z = aspect < 1 ? 5.6 / Math.max(aspect, 0.6) * 0.75 : 4.6
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

export default function VisionScene({ progress, bg }: { progress: Progress; bg: string }) {
  const mobile = window.matchMedia('(max-width: 760px)').matches
  const quality = mobile ? 'low' : 'high'
  return (
    <Canvas
      camera={{ position: [0, 0, 4.6], fov: 38 }}
      dpr={mobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true }}
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* 透過マテリアルは背景を屈折させるので、セクションの地色を背景に敷く（透明だと黒くなる） */}
      <color attach="background" args={[bg]} />
      <CameraFit />
      <Backdrop progress={progress} />
      <Presence progress={progress} quality={quality} />
      <ambientLight intensity={0.6} />
      {/* HDR を読み込まない自前の光環境（午後の窓の光） */}
      <Environment resolution={128}>
        {/* 主光源は左上（書斎の窓）。サイト全体で同じ向き */}
        <Lightformer intensity={3.2} position={[-4, 4, 3]} scale={[6, 4, 1]} color="#FFF4E8" />
        <Lightformer intensity={1.6} position={[0, 4, -6]} scale={[10, 6, 1]} color="#FFF4E8" />
        <Lightformer intensity={2} position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} color="#F2B18F" />
        <Lightformer intensity={1.4} position={[5, -1, 0]} rotation-y={-Math.PI / 2} scale={[12, 3, 1]} color="#B9C7D4" />
      </Environment>
    </Canvas>
  )
}
