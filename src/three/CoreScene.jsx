import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildShapes, neuralNodes, neuralSegments, palettes } from './shapes'
import { store } from '../lib/store'

const vertexShader = /* glsl */ `
  attribute float aRand;
  uniform float uTime, uSize, uPR;
  varying float vR;
  void main() {
    vec3 p = position;
    p += 0.035 * vec3(sin(uTime * 1.3 + aRand * 40.), cos(uTime * 1.1 + aRand * 31.), sin(uTime * .9 + aRand * 23.));
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPR * (.35 + aRand * .8) / -mv.z;
    vR = aRand;
  }
`
const fragmentShader = /* glsl */ `
  uniform vec3 uColA, uColB;
  uniform float uOpacity, uAlpha;
  varying float vR;
  void main() {
    float d = length(gl_PointCoord - .5);
    if (d > .5) discard;
    float a = pow(1. - d * 2., 1.6);
    gl_FragColor = vec4(mix(uColA, uColB, vR), clamp(a * (.35 + .5 * vR) * uAlpha, 0., 1.) * uOpacity);
  }
`

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const glowSize = [2.6, 1.3, 0.9, 1.0, 1.6, 2.0]

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,.35)'); grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

const toColors = (list) => list.map(([a, b]) => [new THREE.Color(a), new THREE.Color(b)])

function Core({ count }) {
  const group = useRef(), geo = useRef(), lines = useRef(), glow = useRef(), mat = useRef()
  const cur = useRef(0), rotY = useRef(0), themeRef = useRef(null)

  const { shapes, rand, anchors } = useMemo(() => buildShapes(count), [count])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const center = useMemo(() => new THREE.Vector3(), [])
  const positions = useMemo(() => new Float32Array(shapes[0]), [shapes])
  const segments = useMemo(() => neuralSegments(neuralNodes()), [])
  const colorSets = useMemo(() => ({ dark: toColors(palettes.dark), light: toColors(palettes.light) }), [])
  const tex = useMemo(glowTexture, [])
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uSize: { value: count < 5000 ? 34 : 40 },
    uPR: { value: Math.min(window.devicePixelRatio, 2) },
    uColA: { value: new THREE.Color() }, uColB: { value: new THREE.Color() },
    uOpacity: { value: 1 }, uAlpha: { value: 1 },
  }), [count])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05), t = state.clock.elapsedTime
    const reduce = store.reducedMotion
    const light = store.theme === 'light'

    // 0 · theme switch: additive glow on dark, normal "ink" blending on light
    if (themeRef.current !== store.theme) {
      themeRef.current = store.theme
      const blending = light ? THREE.NormalBlending : THREE.AdditiveBlending
      for (const m of [mat.current, lines.current.material, glow.current.material]) { m.blending = blending; m.needsUpdate = true }
      uniforms.uAlpha.value = light ? 1.35 : 1
    }
    const colors = light ? colorSets.light : colorSets.dark

    // 1 · morph between the two nearest shapes
    cur.current += (store.stage - cur.current) * (reduce ? 1 : Math.min(1, dt * 4))
    const c = cur.current
    const i0 = Math.min(5, Math.floor(c)), i1 = Math.min(5, i0 + 1), f = c - i0
    const A = shapes[i0], B = shapes[i1]
    for (let k = 0; k < positions.length; k++) positions[k] = A[k] + (B[k] - A[k]) * f
    geo.current.attributes.position.needsUpdate = true

    // 2 · colour, lines, glow
    uniforms.uTime.value = reduce ? 0 : t
    uniforms.uColA.value.copy(colors[i0][0]).lerp(colors[i1][0], f)
    uniforms.uColB.value.copy(colors[i0][1]).lerp(colors[i1][1], f)
    lines.current.material.color.copy(uniforms.uColA.value)
    lines.current.material.opacity = Math.max(0, 1 - Math.abs(c - 3) * 1.6) * (light ? 0.35 : 0.22)
    const fade = store.fade
    uniforms.uOpacity.value = 1 - fade * (light ? 0.85 : 0.75)
    const gs = glowSize[i0] + (glowSize[i1] - glowSize[i0]) * f
    glow.current.scale.setScalar(gs * (reduce ? 1 : 1 + Math.sin(t * 2.2) * 0.06))
    glow.current.material.color.copy(uniforms.uColB.value)
    glow.current.material.opacity = (light ? 0.18 : 0.5 + 0.25 * (1 - smooth(0, 1, c))) * (1 - fade * 0.8)

    // 3 · placement: behind the portrait in the hero, then to the side for the story
    const vw = state.viewport.width, vh = state.viewport.height
    const W = window.innerWidth, H = window.innerHeight, desktop = W > 900
    const p = store.portrait
    let hx = desktop ? vw * 0.22 : 0, hy = desktop ? 0 : vh * 0.2, hs = 1.6
    if (p.ready) {
      hx = (p.cx / W - 0.5) * vw
      hy = -((p.cy - window.scrollY) / H - 0.5) * vh
      hs = (p.h / H) * vh * 0.64
    }
    const w = smooth(0, 1, c)
    const sx = desktop ? vw * 0.2 : 0, sy = desktop ? 0 : vh * 0.2, ss = desktop ? 0.82 : 0.7
    let x = hx + (sx - hx) * w, y = hy + (sy - hy) * w, s = hs + (ss - hs) * w
    x *= 1 - fade; s *= 1 + fade * 0.5
    const g = group.current
    const k = c < 0.3 ? 1 : 0.08 // stick to the card while it scrolls in the hero
    g.position.x += (x - g.position.x) * k
    g.position.y += (y - g.position.y) * k
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * k)

    // 4 · rotation: the halo faces the camera, the stages orbit
    rotY.current += reduce ? 0 : dt * (0.12 + 0.05 * Math.sin(t * 0.3))
    const px = store.pointer.x, py = store.pointer.y
    g.rotation.y = w * (rotY.current + c * 0.6 + px * 0.4) + (1 - w) * px * 0.25
    g.rotation.x = w * (0.25 * Math.sin(c * 1.1) + py * 0.25 + Math.max(0, c - 4.5) * 0.9 * (1 - fade)) + (1 - w) * py * 0.2
    g.rotation.z = (1 - w) * (reduce ? 0 : t * 0.08)

    // 5 · project the label anchors of the nearest stage to screen pixels
    g.updateMatrixWorld()
    const nearest = Math.round(c), L = store.labels
    L.stage = nearest
    L.opacity = nearest >= 1 ? Math.max(0, 1 - Math.abs(c - nearest) * 3) * (1 - fade) : 0
    if (L.opacity > 0) {
      center.setFromMatrixPosition(g.matrixWorld).applyMatrix4(state.camera.matrixWorldInverse)
      anchors[nearest].forEach((a, i) => {
        tmp.set(a[0], a[1], a[2]).applyMatrix4(g.matrixWorld)
        const depth = tmp.clone().applyMatrix4(state.camera.matrixWorldInverse).z
        tmp.project(state.camera)
        const pt = L.pts[i]
        pt.x = (tmp.x * 0.5 + 0.5) * W
        pt.y = (-tmp.y * 0.5 + 0.5) * H
        pt.front = depth > center.z - 0.2
      })
    }
  })

  return (
    <group ref={group}>
      <points>
        <bufferGeometry ref={geo}>
          <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
          <bufferAttribute attach="attributes-aRand" array={rand} count={count} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
          transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={segments} count={segments.length / 3} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <sprite ref={glow}>
        <spriteMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

export default function CoreScene() {
  const count = window.innerWidth < 700 ? 3600 : 7200
  return (
    <Canvas className="core-canvas" dpr={[1, 2]} camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      <Core count={count} />
    </Canvas>
  )
}