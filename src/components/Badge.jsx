import { useEffect, useMemo, useRef, useState } from 'react'
import { shared } from '../data/content'
import { usePrefs } from '../lib/preferences'
import { store } from '../lib/store'

// Deterministic barcode from a string (decorative, not scannable)
function Barcode({ value, className }) {
  const bars = useMemo(() => {
    let seed = [...value].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483647
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    const out = []; let x = 0
    while (x < 118) { const w = rnd() < 0.3 ? 3 : rnd() < 0.6 ? 2 : 1; out.push([x, w]); x += w + 1 + Math.floor(rnd() * 2) }
    return out
  }, [value])
  return (
    <svg className={className} viewBox="0 0 120 28" preserveAspectRatio="none" aria-hidden="true">
      {bars.map(([x, w]) => <rect key={x} x={x} y="0" width={w} height="28" />)}
    </svg>
  )
}

/**
 * A professional ID badge hanging from a lanyard.
 * - swings like a pendulum when the pointer moves past it
 * - can be grabbed and swung (drag), springs back
 * - click / Enter flips it to the contact side
 */
export default function Badge({ cardRef }) {
  const { t } = usePrefs()
  const b = t.ui.badge
  const rig = useRef(null)
  const [flipped, setFlipped] = useState(false)
  const phys = useRef({ angle: 0, vel: 0, dragging: false, startX: 0, startAngle: 0, lastX: 0, lastT: 0, moved: 0 })

  // Pendulum physics (spring + damping), written straight to the DOM each frame
  useEffect(() => {
    if (store.reducedMotion) return
    const p = phys.current
    let raf, last = performance.now()
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04); last = now
      if (!p.dragging) {
        const acc = -42 * p.angle - 3.2 * p.vel
        p.vel += acc * dt
        p.angle += p.vel * dt
      }
      if (rig.current) rig.current.style.transform = `rotate(${p.angle.toFixed(3)}deg)`
      if (cardRef.current) cardRef.current.style.setProperty('--swing', `${(-p.vel * 0.06).toFixed(2)}deg`)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // A pointer passing by nudges the badge
    const nudge = (e) => {
      if (p.dragging || window.scrollY > window.innerHeight) return
      const r = cardRef.current?.getBoundingClientRect()
      if (!r) return
      const near = e.clientY > r.top - 120 && e.clientY < r.bottom + 60 && e.clientX > r.left - 160 && e.clientX < r.right + 160
      if (near) p.vel += Math.max(-40, Math.min(40, e.movementX * 1.4))
    }
    window.addEventListener('pointermove', nudge, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', nudge) }
  }, [cardRef])

  // Drag to swing; a click without movement flips the card
  const onDown = (e) => {
    const p = phys.current
    p.dragging = true; p.startX = e.clientX; p.startAngle = p.angle; p.lastX = e.clientX; p.lastT = performance.now(); p.moved = 0
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e) => {
    const el = cardRef.current, r = el.getBoundingClientRect()
    el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
    const p = phys.current
    if (!p.dragging) return
    const now = performance.now(), dx = e.clientX - p.lastX
    p.moved += Math.abs(dx)
    p.angle = Math.max(-38, Math.min(38, p.startAngle + (e.clientX - p.startX) * 0.14))
    p.vel = (dx * 0.14) / Math.max((now - p.lastT) / 1000, 0.008)
    p.lastX = e.clientX; p.lastT = now
  }
  const onUp = () => {
    const p = phys.current
    if (!p.dragging) return
    p.dragging = false
    p.vel = Math.max(-260, Math.min(260, p.vel))
    if (p.moved < 6) setFlipped((f) => !f)
  }
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); phys.current.vel += 60 }
  }

  return (
    <div className="badge-stage">
      <div className="badge-drop">
        <div className="badge-rig" ref={rig}>
          <div className="lanyard" aria-hidden="true">
            <span>{`${shared.firstName} ${shared.lastName} · AI Core · `.repeat(4)}</span>
          </div>
          <div className="badge-clip" aria-hidden="true"><i /></div>

          <div ref={cardRef} className="badge" data-flipped={flipped} role="button" tabIndex={0}
            aria-pressed={flipped} aria-label={b.aria}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
            <div className="badge-inner">

              {/* ── FRONT ── */}
              <div className="badge-face badge-front" aria-hidden={flipped}>
                <span className="badge-slot" />
                <header className="badge-top">
                  <span className="badge-logo">CO</span>
                  <span className="badge-org">{b.org}</span>
                  <span className="badge-chip" aria-hidden="true" />
                </header>

                <div className="badge-photo">
                  <img src={shared.photo} alt={`${shared.firstName} ${shared.lastName}`} width="1050" height="1400"
                    fetchPriority="high" draggable="false" style={{ objectPosition: shared.photoPosition }} />
                  <span className="badge-status"><i />{t.ui.online}</span>
                </div>

                <div className="badge-who">
                  <div className="badge-name">{shared.firstName}<br />{shared.lastName}</div>
                  <div className="badge-role">{b.role}</div>
                  <div className="badge-team">{b.team}</div>
                </div>

                <dl className="badge-fields">
                  <div><dt>{b.idLabel}</dt><dd>{shared.badge}</dd></div>
                  <div><dt>{b.validLabel}</dt><dd>{b.valid}</dd></div>
                  <div><dt>{b.accessLabel}</dt><dd>{b.access}</dd></div>
                </dl>

                <footer className="badge-foot">
                  <Barcode value={shared.badge + shared.email} className="badge-barcode" />
                  <span className="badge-code">{shared.badge}</span>
                </footer>
                <span className="badge-foil" aria-hidden="true" />
              </div>

              {/* ── BACK ── */}
              <div className="badge-face badge-back" aria-hidden={!flipped}>
                <span className="badge-slot" />
                <header className="badge-back-head">
                  <span className="badge-logo">CO</span>
                  <span>{b.backTitle}</span>
                </header>
                <ul className="badge-contact">
                  <li><span>Email</span><b>{shared.email}</b></li>
                  <li><span>{t.contact.labels.phone}</span><b>{shared.phone}</b></li>
                  <li><span>LinkedIn</span><b>{shared.linkedin.label}</b></li>
                  <li><span>GitHub</span><b>{shared.github.label}</b></li>
                </ul>
                <div className="badge-domains">
                  <span className="badge-label">{b.domainsLabel}</span>
                  <div>{b.domains.map((d) => <span key={d}>{d}</span>)}</div>
                </div>
                <footer className="badge-back-foot">
                  <img src={shared.avatar} alt="" width="40" height="40" draggable="false" />
                  <div><b>{shared.firstName} {shared.lastName}</b><span>{b.based}</span></div>
                </footer>
                <span className="badge-foil" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="badge-hint" aria-hidden="true">{flipped ? b.flipBack : b.flip}</p>
    </div>
  )
}