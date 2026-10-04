import { useEffect, useRef } from 'react'
import { profile } from '../data/content'
import { stageNames } from '../three/shapes'
import { store } from '../lib/store'
import { scrollTo } from '../lib/smoothScroll'

const links = [['#story', 'Core'], ['#spiricom', 'SpiriCom'], ['#work', 'Work'], ['#experience', 'Experience'], ['#skills', 'Skills'], ['#contact', 'Contact']]

export function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top" onClick={(e) => { e.preventDefault(); scrollTo('#top') }} aria-label="Back to top">
        <img className="brand-avatar" src={profile.avatar} alt="" />
        <span className="brand-name">{profile.firstName} {profile.lastName}</span>
      </a>
      <nav className="nav-links" aria-label="Sections">
        {links.map(([href, label]) => (
          <a key={href} href={href} className={href === '#contact' ? 'keep' : undefined}
            onClick={(e) => { e.preventDefault(); scrollTo(href) }}>{label}</a>
        ))}
      </nav>
      <div className="progress" aria-hidden="true"><i id="progressBar" /></div>
    </header>
  )
}

// Fixed readout of the core's state, updated every frame without re-rendering React
export function Hud() {
  const num = useRef(), name = useRef(), ticks = useRef(), root = useRef()
  useEffect(() => {
    let raf, last = -1
    const loop = () => {
      const s = Math.round(store.stage)
      if (s !== last) {
        last = s
        num.current.textContent = String(s).padStart(2, '0')
        name.current.textContent = stageNames[s]
        ;[...ticks.current.children].forEach((el, j) => el.classList.toggle('on', j < s))
      }
      root.current.style.opacity = store.fade > 0.5 ? 0 : 1
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  const count = typeof window !== 'undefined' && window.innerWidth < 700 ? 3600 : 7200
  return (
    <div className="hud" ref={root} aria-hidden="true">
      <div>CORE · STAGE <span className="val" ref={num}>00</span>/05 · <span className="val" ref={name}>IDLE</span></div>
      <div className="hud-ticks" ref={ticks}><i /><i /><i /><i /><i /></div>
      <div>PARTICLES <span className="val">{count.toLocaleString('en-US')}</span></div>
    </div>
  )
}
