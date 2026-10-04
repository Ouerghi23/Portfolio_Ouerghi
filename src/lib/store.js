// A tiny mutable store shared between the DOM (GSAP/ScrollTrigger) and the WebGL scene.
// Written on scroll, read every frame in useFrame. No React re-renders involved.
export const store = {
  stage: 0,          // 0 = hero halo, 1..5 = stages (fractional while morphing)
  fade: 0,           // 0..1 once the story is over: core recedes into the background
  theme: 'dark',     // set by PreferencesProvider; the scene switches blending and palette
  pointer: { x: 0, y: 0 },
  // screen positions of the tech labels attached to the current shape (written by CoreScene)
  labels: { stage: 0, opacity: 0, pts: Array.from({ length: 5 }, () => ({ x: 0, y: 0, front: true })) },
  // portrait card, in document coordinates (px), measured by <Hero />
  portrait: { cx: 0, cy: 0, h: 0, ready: false },
  reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    store.pointer.x = e.clientX / window.innerWidth - 0.5
    store.pointer.y = e.clientY / window.innerHeight - 0.5
  }, { passive: true })
}