// ヒーロー背景：「書斎の窓辺」に差し込む午後の光（ShaderGradient）
// サイトの「光」の2色（--light-warm / --light-cool）と生成りだけで組む。
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

export default function HeroLight({ still }: { still: boolean }) {
  const mobile = window.matchMedia('(max-width: 760px)').matches
  return (
    <ShaderGradientCanvas
      style={{ position: 'absolute', inset: 0 }}
      pixelDensity={mobile ? 0.8 : 1}
      fov={45}
      lazyLoad={false}
      // Liquid Glass がこのキャンバスを読み取って屈折させるために必要
      preserveDrawingBuffer
    >
      <ShaderGradient
        type="waterPlane"
        animate={still ? 'off' : 'on'}
        uTime={2.4}
        uSpeed={0.09}
        uStrength={2.2}
        uDensity={1.05}
        uFrequency={5.5}
        uAmplitude={0}
        color1="#F0C3AD"
        color2="#FAF6F0"
        color3="#C4CFD9"
        brightness={0.95}
        reflection={0.08}
        lightType="3d"
        grain="on"
        cAzimuthAngle={180}
        cPolarAngle={90}
        cDistance={3.4}
        cameraZoom={1}
        positionX={0.6}
        positionY={0}
        positionZ={0}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
      />
    </ShaderGradientCanvas>
  )
}
