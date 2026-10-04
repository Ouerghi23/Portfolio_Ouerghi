// Point-cloud targets for each stage of the AI Core.
// Every shape returns a Float32Array of N*3 positions so they can be morphed point by point.

function rng(seed = 7) {
  let s = seed
  const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
  const gauss = () => {
    const u = r() || 1e-6, v = r()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
  const dir = () => {
    const z = r() * 2 - 1, t = r() * Math.PI * 2, k = Math.sqrt(1 - z * z)
    return [k * Math.cos(t), k * Math.sin(t), z]
  }
  return { r, gauss, dir }
}

function fill(N, f) {
  const a = new Float32Array(N * 3)
  for (let i = 0; i < N; i++) {
    const p = f(i)
    a[i * 3] = p[0]; a[i * 3 + 1] = p[1]; a[i * 3 + 2] = p[2]
  }
  return a
}

// Neural layout shared by the LEARNING shape and the connection lines
export function neuralNodes() {
  const layers = [7, 12, 16, 12, 5]
  const nodes = []
  layers.forEach((count, l) => {
    for (let k = 0; k < count; k++) {
      const a = (k / count) * Math.PI * 2
      const h = (k - (count - 1) / 2) * (3.4 / Math.max(count, 8))
      nodes.push({ l, p: [(l - 2) * 1.15, h, Math.sin(a) * 0.35] })
    }
  })
  return nodes
}

export function neuralSegments(nodes) {
  const segs = []
  for (const a of nodes) for (const b of nodes) if (b.l === a.l + 1) segs.push(...a.p, ...b.p)
  return new Float32Array(segs)
}

export function buildShapes(N) {
  const { r, gauss, dir } = rng(7)
  const shapes = []

  // 0 · HALO: a ring of light that frames the portrait in the hero
  shapes.push(fill(N, () => {
    const t = r() * Math.PI * 2, pick = r()
    if (pick < 0.55) { const R = 1 + gauss() * 0.025; return [Math.cos(t) * R, Math.sin(t) * R, gauss() * 0.04] }
    if (pick < 0.7) { const R = 1.16 + gauss() * 0.012; return [Math.cos(t) * R, Math.sin(t) * R, gauss() * 0.02] }
    const R = 0.92 + Math.pow(r(), 1.8) * 0.9
    return [Math.cos(t) * R, Math.sin(t) * R, gauss() * 0.15]
  }))

  // 1 · INPUT: signal streams converging from far away
  const streams = Array.from({ length: 14 }, dir)
  shapes.push(fill(N, (i) => {
    const s = streams[i % 14], t = Math.pow(r(), 0.8), R = 0.5 + 4.2 * t, j = 0.05 + 0.25 * t
    return [s[0] * R + gauss() * j, s[1] * R + gauss() * j, s[2] * R + gauss() * j]
  }))

  // 2 · DATA: an ordered lattice
  const g = Math.ceil(Math.cbrt(N)), sp = 3 / (g - 1)
  shapes.push(fill(N, (i) => [(i % g) * sp - 1.5, (Math.floor(i / g) % g) * sp - 1.5, (Math.floor(i / (g * g)) % g) * sp - 1.5]))

  // 3 · LEARNING: layered neural network
  const nodes = neuralNodes()
  shapes.push(fill(N, (i) => {
    const n = nodes[i % nodes.length].p
    return [n[0] + gauss() * 0.07, n[1] + gauss() * 0.07, n[2] + gauss() * 0.07]
  }))

  // 4 · INTELLIGENCE: folded two-hemisphere shell
  shapes.push(fill(N, () => {
    const d = dir(), inner = r() < 0.18
    const R = inner ? 0.55 * Math.cbrt(r()) : 1 + 0.09 * Math.sin(d[0] * 11) * Math.sin(d[1] * 13) * Math.sin(d[2] * 9)
    let x = d[0] * R * 1.55
    if (!inner) x += Math.sign(x) * 0.07
    return [x, d[1] * R * 1.2, d[2] * R * 1.3]
  }))

  // 5 · ACTION: three-arm spiral pushing outward
  shapes.push(fill(N, (i) => {
    const arm = i % 3, t = r(), R = 0.25 + 3.3 * Math.sqrt(t), a = arm * 2.094 + R * 1.35 + gauss() * 0.12
    return [Math.cos(a) * R, gauss() * 0.08 * (1 + R * 0.3), Math.sin(a) * R]
  }))

  const rand = new Float32Array(N)
  for (let i = 0; i < N; i++) rand[i] = r()

  // Anchor points where the DOM labels (tech tags) attach to each shape, 5 per stage
  const anchors = [
    [],                                                                   // halo: no labels
    streams.slice(0, 5).map((d) => d.map((v) => v * 3.2)),                // input: stream ends
    [[1.5, 1.5, 1.5], [-1.5, 1.5, -1.5], [1.5, -1.5, -1.5], [-1.5, -1.5, 1.5], [1.5, 0, -1.5]], // data: lattice corners
    [nodes[3], nodes[18], nodes[19], nodes[46], nodes[49]].map((n) => n.p), // learning: neurons across layers
    [[1.7, 0.3, 0], [0, 1.25, 0.2], [0.8, -0.9, 0.75], [-0.8, -0.8, -0.75], [-1.55, 0.35, 0.3]], // intelligence: shell
    [0, 1, 2].map((arm) => { const R = 3.3, a = arm * 2.094 + R * 1.35; return [Math.cos(a) * R, 0, Math.sin(a) * R] })
      .concat([0, 1].map((arm) => { const R = 1.8, a = arm * 2.094 + R * 1.35; return [Math.cos(a) * R, 0, Math.sin(a) * R] })), // action: spiral arms
  ]
  return { shapes, rand, anchors }
}

// [colour A, colour B] per stage. Dark mode uses additive light; light mode uses ink-like colours.
export const palettes = {
  dark: [
    ['#C9BBFF', '#8E7BFF'], // halo (brand lavender)
    ['#FFC46B', '#B8A6FF'], // input
    ['#8FD3FF', '#5C7CFF'], // data
    ['#B8A6FF', '#8FD3FF'], // learning
    ['#FF9BD9', '#B8A6FF'], // intelligence
    ['#92D6A6', '#E6F7EC'], // action
  ],
  light: [
    ['#5B45D6', '#8A76F0'],
    ['#B5650A', '#5B45D6'],
    ['#1667A8', '#2F4FD6'],
    ['#5B45D6', '#1667A8'],
    ['#B8337F', '#5B45D6'],
    ['#1E8A4C', '#5B45D6'],
  ],
}