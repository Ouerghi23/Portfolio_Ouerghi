import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import CoreScene from './three/CoreScene'
import { Nav } from './components/Nav'
import Hero from './components/Hero'
import { Stages, Thesis } from './components/Story'
import { CaseStudy, Work, Experience, Skills, Education, Contact } from './components/Record'
import { initSmoothScroll } from './lib/smoothScroll'
import { usePrefs } from './lib/preferences'
import { store } from './lib/store'
import { Analytics } from '@vercel/analytics/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export default function App() {
  const root = useRef(null)
  const { t, lang } = usePrefs()

  useEffect(() => initSmoothScroll(), [])

  // Text length changes with the language → recompute every trigger position
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [lang])

  useGSAP(() => {
    const reduce = store.reducedMotion

    // ── 1. Scroll → 3D core.
    // Entering #story morphs the hero halo into stage 1; while #story is pinned (CSS sticky),
    // the remaining scroll is split into four equal moves 1→2→3→4→5, each with a resting plateau.
    let entry = 0, pinned = 0
    const step = (x) => { const f = Math.floor(Math.min(x, 3.999)); return x >= 4 ? 4 : f + smooth(0.3, 0.7, x - f) }
    const update = () => { store.stage = smooth(0.15, 1, entry) + step(pinned * 4) }
    ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'top top', onUpdate: (s) => { entry = s.progress; update() } })
    ScrollTrigger.create({ trigger: '#story', start: 'top top', end: 'bottom bottom', onUpdate: (s) => { pinned = s.progress; update() } })

    // ── 2. After the thesis line, the core recedes into an ambient backdrop
    ScrollTrigger.create({
      trigger: '.thesis', start: 'top center', end: 'bottom top',
      onUpdate: (self) => { store.fade = smooth(0, 1, self.progress) },
    })

    // ── 3. Reading progress inside the nav
    gsap.to('#progressBar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } })

    if (reduce) return

    // ── 4. Hero intro
    const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
    intro
      .from('.nav-shell', { y: -30, opacity: 0, duration: 1.1 }, 0)
      .from('.hero-eyebrow', { opacity: 0, y: 12, duration: 0.7 }, 0.1)
      .from('.hero-title .word', { yPercent: 110, duration: 1.3, stagger: 0.1 }, 0.15)
      .from('.badge-drop', { yPercent: -130, duration: 1.9, ease: 'elastic.out(1, 0.5)' }, 0.2)
      .from('.badge-hint', { opacity: 0, duration: 0.8 }, 1.2)
      .from(['.hero-role', '.hero-lede', '.hero-actions', '.hero-meta'], { opacity: 0, y: 18, duration: 0.8, stagger: 0.08 }, 0.5)
      .from('.hero-bottom', { opacity: 0, duration: 1 }, 0.9)

    // ── 5. Hero exit: copy drifts up, portrait turns away
    gsap.to('.hero-copy', {
      y: -80, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to('.hero-visual', {
      yPercent: -10, rotateY: -16, rotateX: 6, transformPerspective: 1200, scale: 0.86, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true },
    })

    // ── 6. Content reveals (start mostly visible, so nothing is ever hidden)
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.from(el, { y: 35, opacity: 0.15, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
    })

    // ── 7. Thesis fills in as you read it
    gsap.utils.toArray('.thesis-text').forEach((el) => {
      gsap.fromTo(el, { backgroundSize: '0% 100%, 100% 100%' }, {
        backgroundSize: '100% 100%, 100% 100%', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      })
    })

    // ── 8. SpiriCom chart draws itself
    gsap.from('.spark-line', {
      strokeDasharray: 600, strokeDashoffset: 600, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: '.console', start: 'top 80%', once: true },
    })

    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, { scope: root })

    return (
    <div ref={root}>
      <CoreScene />
      <div className="vignette" aria-hidden="true" />
      <Nav />

      <main id="main">
        <Hero />
        <Stages />
        <Thesis />
        <div className="record">
          <CaseStudy />
          <Work />
          <Experience />
          <Skills />
          <Education />
          <Contact />
        </div>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <span>© 2026 Chaïma Ouerghi</span>
          <span>{t.ui.footer}</span>
        </div>
      </footer>

      <Analytics />
    </div>
  )
}