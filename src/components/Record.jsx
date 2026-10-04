import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { shared } from '../data/content'
import { usePrefs } from '../lib/preferences'

const Tags = ({ items }) => <div className="tags">{items.map((t) => <span className="tag" key={t}>{t}</span>)}</div>

const Head = ({ eyebrow, title, id, children }) => (
  <div className="block-head reveal">
    <div><span className="eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2></div>
    {children}
  </div>
)

export function CaseStudy() {
  const { t } = usePrefs()
  const cs = t.caseStudy, ui = t.ui
  const line = 'M0 70 L20 66 L40 69 L60 64 L80 67 L100 62 L120 65 L140 61 L160 64 L180 60 L200 62 L220 55 L240 44 L260 22 L280 14 L300 19 L320 16'
  return (
    <section className="block" id="spiricom" aria-labelledby="case-title">
      <div className="wrap">
        <Head eyebrow={cs.eyebrow} title={cs.name} id="case-title"><p className="block-sub">{cs.summary}</p></Head>
        <div className="case">
          <div className="case-col reveal">
            <div className="meta-row">
              <span>{ui.role} <b>{cs.role}</b></span>
              <span>{ui.method} <b>{cs.method}</b></span>
              <span>{ui.code} <a href={shared.repo} target="_blank" rel="noopener noreferrer">GitHub ↗</a></span>
            </div>
            <dl className="pao">{cs.pao.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}</dl>
            <Tags items={cs.stack} />
          </div>
          <div className="console reveal">
            <div className="console-bar"><span className="dots"><i /><i /><i /></span><span>{ui.illustrative}</span></div>
            <div className="console-body">
              <div>
                <div className="spark-label"><span>{ui.chartLabel}</span><b>{ui.chartFlag}</b></div>
                <svg className="spark" viewBox="0 0 320 90" role="img" aria-label={ui.chartAria}>
                  <line x1="0" y1="30" x2="320" y2="30" stroke="var(--line-strong)" strokeDasharray="3 4" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="var(--line-strong)" strokeDasharray="3 4" />
                  <text x="316" y="26" fill="var(--text-muted)" fontSize="9" fontFamily="DM Mono, monospace" textAnchor="end">{ui.threshold}</text>
                  <path d={`${line} L320 90 L0 90Z`} fill="var(--danger-soft)" />
                  <path className="spark-line" d={line} fill="none" stroke="var(--danger)" strokeWidth="2" />
                  <circle cx="280" cy="14" r="4" fill="var(--danger)" />
                </svg>
              </div>
              <div className="chat">
                <div className="q"><small>{ui.engineer}</small>{ui.chatQ}</div>
                <div className="a"><small>{ui.assistant}</small>{ui.chatA}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="stats reveal">{cs.stats.map(([v, l]) => (<div key={l}><b>{v}</b><span>{l}</span></div>))}</div>
      </div>
    </section>
  )
}

export function Work() {
  const { t } = usePrefs()
  const [filter, setFilter] = useState('all')
  const shown = t.projects.filter((p) => filter === 'all' || p.tags.includes(filter))
  useEffect(() => { ScrollTrigger.refresh() }, [filter]) // list height changed
  return (
    <section className="block" id="work" aria-labelledby="work-title">
      <div className="wrap">
        <Head eyebrow={t.work.eyebrow} title={t.work.title} id="work-title">
          <div className="filter-box">
            <div className="filters" role="group" aria-label={t.work.title}>
              {t.filters.map(([id, label]) => (
                <button key={id} id={`filter-${id}`} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
              ))}
            </div>
            <span className="count">{shown.length} {shown.length === 1 ? t.ui.project : t.ui.projects}</span>
          </div>
        </Head>
        <ol className="work-list">
          {shown.map((p, i) => (
            <li className="work-item" key={p.id}>
              <span className="work-idx">{String(i + 1).padStart(2, '0')}</span>
              <div className="work-title"><h3>{p.name}</h3><p>{p.kind}</p></div>
              <div className="work-desc"><p>{p.desc}</p><Tags items={p.stack} /></div>
              <div className="work-link">
                {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{t.ui.repository}</a> : <span>{p.note}</span>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function Experience() {
  const { t } = usePrefs()
  return (
    <section className="block" id="experience" aria-labelledby="exp-title">
      <div className="wrap">
        <Head eyebrow={t.experienceHead.eyebrow} title={t.experienceHead.title} id="exp-title" />
        <ol className="timeline">
          {t.experience.map((j) => (
            <li className="job reveal" key={j.id}>
              <div className="job-when"><b>{j.when}</b>{j.where}</div>
              <div>
                <h3>{j.role}</h3><div className="org">{j.org}</div>
                <ul>{j.points.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            </li>
          ))}
        </ol>
        <p className="earlier">{t.earlier}</p>
      </div>
    </section>
  )
}

export function Skills() {
  const { t } = usePrefs()
  const [h1, h2, h3] = t.ui.tableHead
  return (
    <section className="block" id="skills" aria-labelledby="skills-title">
      <div className="wrap">
        <Head eyebrow={t.skillsHead.eyebrow} title={t.skillsHead.title} id="skills-title" />
        <div className="table-wrap reveal">
          <table>
            <thead><tr><th>{h1}</th><th>{h2}</th><th>{h3}</th></tr></thead>
            <tbody>{t.skills.map(([d, tools, used], i) => (<tr key={i}><td>{d}</td><td>{tools}</td><td>{used}</td></tr>))}</tbody>
          </table>
        </div>
        <p className="ways"><b>{t.ui.ways}</b> {t.waysOfWorking}</p>
      </div>
    </section>
  )
}

export function Education() {
  const { t } = usePrefs()
  return (
    <section className="block" id="education" aria-labelledby="edu-title">
      <div className="wrap">
        <Head eyebrow={t.educationHead.eyebrow} title={t.educationHead.title} id="edu-title" />
        <div className="edu">
          <div>{t.education.map((e) => (
            <div className="degree reveal" key={e.id}><span className="yr">{e.years}</span><h3>{e.title}</h3><p>{e.place}</p></div>
          ))}</div>
          <div className="langs reveal">
            {t.languages.map(([l, v, lvl], i) => (
              <div className="lang" key={i}>{l}<div className="bar"><i style={{ width: `${v}%` }} /></div><span>{lvl}</span></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Contact() {
  const { t, lang } = usePrefs()
  const c = t.contact, ui = t.ui
  const [toast, setToast] = useState('')
  const [time, setTime] = useState('--:--')
  const timer = useRef()
  useEffect(() => {
    const fmt = () => setTime(new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' }).format(new Date()))
    fmt(); const id = setInterval(fmt, 30000); return () => clearInterval(id)
  }, [lang])
  const flash = (m) => { setToast(m); clearTimeout(timer.current); timer.current = setTimeout(() => setToast(''), 1800) }
  const copy = () => {
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents(document.getElementById('mailAddr'))
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); flash(ui.selected)
    }
    try { navigator.clipboard.writeText(shared.email).then(() => flash(ui.copied), fallback) } catch { fallback() }
  }
  return (
    <section className="block contact" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="contact-head reveal">
          <img className="contact-avatar" src={shared.avatar} alt="" width="56" height="56" />
          <span className="eyebrow">{c.eyebrow}</span>
        </div>
        <h2 id="contact-title" className="reveal">{c.title[0]}<em>{c.title[1]}</em></h2>
        <div className="mail reveal">
          <span className="mail-addr" id="mailAddr">{shared.email}</span>
          <button className="button button-primary" id="copyMail" type="button" onClick={copy}>{ui.copy}</button>
        </div>
        <div className="channels reveal">
          <div><span>{c.labels.linkedin}</span><a href={shared.linkedin.url} target="_blank" rel="noopener noreferrer">{shared.linkedin.label} ↗</a></div>
          <div><span>{c.labels.github}</span><a href={shared.github.url} target="_blank" rel="noopener noreferrer">{shared.github.label} ↗</a></div>
          <div><span>{c.labels.phone}</span><b>{shared.phone}</b></div>
          <div><span>{c.labels.based}</span><b>{c.location} · {time}</b></div>
        </div>
      </div>
      <div className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">{toast}</div>
    </section>
  )
}