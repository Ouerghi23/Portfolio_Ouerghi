import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { navIds, shared } from '../data/content'
import { usePrefs } from '../lib/preferences'
import { scrollTo, lockScroll } from '../lib/smoothScroll'

// ── Theme toggle: sun and moon cross-fade, with a circular page reveal (see preferences.jsx)
export function ThemeToggle() {
  const { theme, toggleTheme, t } = usePrefs()
  return (
    <button type="button" className="icon-btn theme-toggle" onClick={toggleTheme}
      aria-label={theme === 'dark' ? t.ui.themeToLight : t.ui.themeToDark} title={theme === 'dark' ? t.ui.themeToLight : t.ui.themeToDark}>
      <svg className="i-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <g>{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1="12" y1="2.6" x2="12" y2="4.8" transform={`rotate(${a} 12 12)`} />
        ))}</g>
      </svg>
      <svg className="i-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6Z" />
      </svg>
    </button>
  )
}

// ── EN | FR segmented switch with a sliding thumb
export function LangSwitch() {
  const { lang, setLang, t } = usePrefs()
  return (
    <div className="lang-switch" role="group" aria-label={t.ui.language} data-lang={lang}>
      <span className="lang-thumb" aria-hidden="true" />
      {['en', 'fr'].map((code) => (
        <button key={code} id={`lang-${code}`} type="button" aria-pressed={lang === code} onClick={() => setLang(code)}>
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function Nav() {
  const { t, lang } = usePrefs()
  const [active, setActive] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false })
  const linkRefs = useRef({})
  const menuRef = useRef(null)

  // keep the closed menu out of the tab order
  useEffect(() => { if (menuRef.current) menuRef.current.inert = !open }, [open])

  // Which section is on screen → highlights its link
  useEffect(() => {
    const sections = navIds.map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) })
    }, { rootMargin: '-45% 0px -50% 0px' })
    sections.forEach((s) => io.observe(s))
    const hero = document.getElementById('top')
    const heroIo = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(null) }, { rootMargin: '-45% 0px -50% 0px' })
    if (hero) heroIo.observe(hero)
    return () => { io.disconnect(); heroIo.disconnect() }
  }, [])

  // Hide while scrolling down, reveal when scrolling up
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 24)
      if (y > last + 6 && y > 200) setHidden(true)
      else if (y < last - 6) setHidden(false)
      last = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sliding pill under the hovered (or active) link
  const place = useCallback(() => {
    const id = hovered ?? active
    const el = id && linkRefs.current[id]
    if (!el) { setIndicator((s) => ({ ...s, visible: false })); return }
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth, visible: true })
  }, [hovered, active])
  useLayoutEffect(() => { place() }, [place, lang])
  useEffect(() => {
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [place])

  // Mobile menu: lock the page and close on Escape
  useEffect(() => {
    lockScroll(open)
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (event, target) => {
    event.preventDefault()
    setOpen(false)
    // wait one frame so the page is unlocked before scrolling
    requestAnimationFrame(() => scrollTo(target))
  }

  return (
    <>
      <a className="skip-link" href="#main">{t.ui.skip}</a>

      <header className="nav" data-hidden={hidden && !open} data-scrolled={scrolled || open}>
        <div className="nav-shell">
          <a href="#top" className="brand" onClick={(e) => go(e, '#top')} aria-label={`${shared.firstName} ${shared.lastName}`}>
            <span className="brand-avatar"><img src={shared.avatar} alt="" width="36" height="36" /></span>
            <span className="brand-text"><strong>{shared.firstName}</strong><span>{shared.lastName}</span></span>
          </a>

          <nav className="nav-links" aria-label="Main" onMouseLeave={() => setHovered(null)}>
            <span className="nav-indicator" aria-hidden="true"
              style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width, opacity: indicator.visible ? 1 : 0 }} />
            {navIds.filter((id) => id !== 'contact').map((id) => (
              <a key={id} href={`#${id}`} ref={(el) => { linkRefs.current[id] = el }}
                aria-current={active === id ? 'true' : undefined}
                onMouseEnter={() => setHovered(id)} onFocus={() => setHovered(id)} onBlur={() => setHovered(null)}
                onClick={(e) => go(e, `#${id}`)}>
                {t.ui.nav[id]}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <span className="availability"><i />{t.ui.available}</span>
            <LangSwitch />
            <ThemeToggle />
            <a href="#contact" className="nav-cta" onClick={(e) => go(e, '#contact')}>
              {t.ui.talk}<span aria-hidden="true">↗</span>
            </a>
            <button type="button" className="menu-button" aria-expanded={open} aria-controls="mobile-menu"
              aria-label={open ? t.ui.menuClose : t.ui.menuOpen} onClick={() => setOpen((v) => !v)}>
              <span /><span />
            </button>
          </div>

          <div className="nav-progress" aria-hidden="true"><i id="progressBar" /></div>
        </div>
      </header>

      {/* Mobile: full-screen menu */}
      <div id="mobile-menu" ref={menuRef} className="mobile-menu" data-open={open} aria-hidden={!open}>
        <nav className="mobile-links" aria-label="Mobile">
          {navIds.map((id, i) => (
            <a key={id} href={`#${id}`} style={{ '--i': i }} aria-current={active === id ? 'true' : undefined} onClick={(e) => go(e, `#${id}`)}>
              <span className="mobile-idx">{String(i + 1).padStart(2, '0')}</span>{t.ui.nav[id]}
            </a>
          ))}
        </nav>
        <div className="mobile-foot">
          <div className="mobile-prefs"><LangSwitch /><ThemeToggle /></div>
          <div className="mobile-contact">
            <img src={shared.avatar} alt="" width="44" height="44" />
            <div><strong>{shared.email}</strong><span>{shared.phone}</span></div>
          </div>
        </div>
      </div>
    </>
  )
}