import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { store } from './store'

gsap.registerPlugin(ScrollTrigger)

let lenis = null

// Lenis gives the "premium" inertia; GSAP's ticker drives it so ScrollTrigger stays in sync.
export function initSmoothScroll() {
  if (store.reducedMotion) return () => {}
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => { gsap.ticker.remove(tick); lenis?.destroy(); lenis = null }
}

export function scrollTo(target) {
  if (typeof target === 'number') {
    if (lenis) lenis.scrollTo(target, { duration: 1.2 })
    else window.scrollTo({ top: target, behavior: store.reducedMotion ? 'auto' : 'smooth' })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  const offset = target === '#top' ? 0 : -90 // leave room for the floating nav
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.6 })
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: store.reducedMotion ? 'auto' : 'smooth' })
}

// Freeze the page while the mobile menu is open
export function lockScroll(locked) {
  if (lenis) locked ? lenis.stop() : lenis.start()
  document.documentElement.style.overflow = locked ? 'hidden' : ''
}