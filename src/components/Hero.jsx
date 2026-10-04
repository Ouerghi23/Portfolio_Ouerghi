import { useEffect, useRef } from 'react'
import { shared } from '../data/content'
import { usePrefs } from '../lib/preferences'
import { store } from '../lib/store'
import { scrollTo } from '../lib/smoothScroll'
import Badge from './Badge'

export default function Hero() {
  const { t } = usePrefs()
  const h = t.hero
  const heroRef = useRef(null)
  const card = useRef(null)

  // Tell the 3D scene where the badge hangs, so the particle halo frames it exactly
  useEffect(() => {
    const measure = () => {
      // offset* ignores CSS transforms, so the scroll animation on the card doesn't skew this
      let el = card.current, top = 0, left = 0
      while (el) { top += el.offsetTop; left += el.offsetLeft; el = el.offsetParent }
      const { offsetWidth: w, offsetHeight: hgt } = card.current
      store.portrait.cx = left + w / 2
      store.portrait.cy = top + hgt / 2
      store.portrait.h = hgt
      store.portrait.ready = true
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(card.current)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  // Pointer: soft parallax on the background glows
  useEffect(() => {
    const hero = heroRef.current
    const move = (e) => {
      const r = hero.getBoundingClientRect()
      hero.style.setProperty('--mouse-x', (e.clientX - r.left) / r.width - 0.5)
      hero.style.setProperty('--mouse-y', (e.clientY - r.top) / r.height - 0.5)
    }
    const leave = () => { hero.style.setProperty('--mouse-x', 0); hero.style.setProperty('--mouse-y', 0) }
    hero.addEventListener('pointermove', move)
    hero.addEventListener('pointerleave', leave)
    return () => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave) }
  }, [])

  const go = (e, target) => { e.preventDefault(); scrollTo(target) }

  return (
    <section ref={heroRef} id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero-background" aria-hidden="true">
        <div className="hero-grid" />
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
      </div>

      <div className="hero-inner wrap">
        <div className="hero-copy">
          <div className="hero-eyebrow"><span className="eyebrow-line" /><span>{h.eyebrow}</span></div>

          <h1 id="hero-title" className="hero-title">
            <span className="line"><span className="word">{shared.firstName}</span></span>
            <span className="line"><span className="word soft">{shared.lastName}</span></span>
          </h1>

          <div className="hero-role">
            {h.role.map((r, i) => (
              <span key={r}>{i > 0 && <i aria-hidden="true">·</i>}{r}</span>
            ))}
          </div>

          <p className="hero-lede">{h.lede}</p>

          <div className="hero-actions">
            <a href="#work" className="button button-primary" onClick={(e) => go(e, '#work')}>
              <span>{h.primary}</span><span className="button-arrow" aria-hidden="true">↗</span>
            </a>
            <a href="#contact" className="button button-secondary" onClick={(e) => go(e, '#contact')}>{h.secondary}</a>
          </div>

          <dl className="hero-meta">
            {h.meta.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        </div>

        <div className="hero-visual">
          <span className="hero-orbit" aria-hidden="true" />
          <Badge cardRef={card} />
        </div>
      </div>

      <div className="hero-bottom wrap" aria-hidden="true">
        <span>{t.ui.scroll}</span>
        <div className="scroll-indicator"><span /></div>
        <span>{t.ui.scrollRight}</span>
      </div>
    </section>
  )
}