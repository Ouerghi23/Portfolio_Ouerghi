import { useEffect, useRef, useState } from 'react'
import { usePrefs } from '../lib/preferences'
import { store } from '../lib/store'
import { scrollTo } from '../lib/smoothScroll'

/**
 * One pinned scene: the 3D core stays put while the five steps play in place.
 * App.jsx maps scroll progress through #story to store.stage (1 → 5).
 * The tech tags are not in the text: they hang on the 3D shape itself (<ShapeLabels />).
 */
export function Stages() {
  const { t } = usePrefs()
  const [active, setActive] = useState(0)       // 0..4
  const [progress, setProgress] = useState(0)   // 0..1 across the five steps

  // Follow the core's stage without re-rendering every frame
  useEffect(() => {
    let raf, lastA = -1, lastP = -1
    const loop = () => {
      const s = Math.min(5, Math.max(1, store.stage))
      const a = Math.round(s) - 1
      const p = Math.round(((s - 1) / 4) * 100) / 100
      if (a !== lastA) { lastA = a; setActive(a) }
      if (p !== lastP) { lastP = p; setProgress(p) }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])

  // Jump to a step: same mapping as App.jsx (pinned scroll split into four equal moves)
  const goTo = (i) => {
    const el = document.getElementById('story')
    const top = el.getBoundingClientRect().top + window.scrollY
    const span = el.offsetHeight - window.innerHeight
    const target = top + (i / 4) * span + 2
    scrollTo(target)
  }

  return (
    <section id="story" className="story" aria-label={t.ui.stageNav}>
      <div className="story-sticky wrap">
        <div className="story-panel">
          <ol className="story-rail" aria-label={t.ui.stageNav} style={{ '--p': progress }}>
            {t.stages.map((s, i) => (
              <li key={s.n}>
                <button type="button" aria-current={active === i ? 'step' : undefined} style={{ '--stage-c': s.color }} onClick={() => goTo(i)}>
                  <span>{s.n}</span><em>{s.label}</em>
                </button>
              </li>
            ))}
          </ol>

          <div className="story-steps">
            {t.stages.map((s, i) => (
              <article key={s.n} className="story-step" data-state={i === active ? 'active' : i < active ? 'past' : 'next'}
                aria-hidden={i !== active} style={{ '--stage-c': s.color }}>
                <div className="stage-header">
                  <span className="stage-number">{s.n}</span>
                  <span className="stage-label">{s.label}</span>
                </div>
                <h2>{s.title}</h2>
                <p>{s.body}</p>
                {s.readout && (
                  <div className="readout">
                    {s.readout.map(([value, label]) => (<div key={label}><b>{value}</b><span>{label}</span></div>))}
                  </div>
                )}
                {/* tags for screen readers and mobile; on desktop they float on the shape */}
                <ul className="story-tags">{s.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </div>
      <ShapeLabels tags={t.stages.map((s) => s.tags)} colors={t.stages.map((s) => s.color)} />
    </section>
  )
}

// Tech tags pinned to anchor points of the 3D shape (positions come from CoreScene every frame)
function ShapeLabels({ tags, colors }) {
  const root = useRef(null)
  const [stage, setStage] = useState(1)
  useEffect(() => {
    let raf, last = -1
    const loop = () => {
      const L = store.labels, el = root.current
      if (el) {
        if (L.stage !== last && L.stage >= 1) { last = L.stage; setStage(L.stage) }
        el.style.opacity = L.opacity.toFixed(3)
        ;[...el.children].forEach((chip, i) => {
          const p = L.pts[i]
          // keep every chip inside the viewport
          const x = Math.max(16, Math.min(p.x, window.innerWidth - chip.offsetWidth - 16))
          const y = Math.max(90, Math.min(p.y, window.innerHeight - 24))
          chip.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
          chip.dataset.front = p.front
        })
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [])
  const list = tags[stage - 1] || []
  return (
    <div className="shape-labels" ref={root} aria-hidden="true" style={{ '--stage-c': colors[stage - 1] }}>
      {list.map((tag, i) => (
        <span key={`${stage}-${tag}`} className="shape-label" style={{ '--i': i }}><i /><b>{tag}</b></span>
      ))}
    </div>
  )
}

export function Thesis() {
  const { t } = usePrefs()
  const [intro, emphasisOne, middle, emphasisTwo, ending] = t.thesis
  return (
    <section className="thesis wrap" aria-label="Thesis">
      <p className="thesis-text">{intro}<em>{emphasisOne}</em>{middle}<em>{emphasisTwo}</em>{ending}</p>
    </section>
  )
}