import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { content } from '../data/content'
import { store } from './store'

// ── safe localStorage (private windows can throw) ──
const read = (key) => { try { return localStorage.getItem(key) } catch { return null } }
const write = (key, value) => { try { localStorage.setItem(key, value) } catch { /* ignore */ } }

const PrefsContext = createContext(null)

function initialTheme() {
  // index.html sets data-theme before React loads, so there is no flash
  const attr = document.documentElement.dataset.theme
  if (attr === 'light' || attr === 'dark') return attr
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function initialLang() {
  const saved = read('lang')
  if (saved === 'en' || saved === 'fr') return saved
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme)
  const [lang, setLangState] = useState(initialLang)

  // theme → <html data-theme>, browser UI colour, 3D scene
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme
    store.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F3F2F6' : '#08090B')
  }, [theme])

  // language → <html lang>, page title
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = lang === 'fr' ? 'Chaïma Ouerghi · Ingénieure IA' : 'Chaïma Ouerghi · AI Engineer'
  }, [lang])

  // Circular reveal from the click point, where the browser supports View Transitions
  const toggleTheme = useCallback((event) => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const apply = () => { setThemeState(next); write('theme', next) }
    if (!document.startViewTransition || store.reducedMotion) { apply(); return }
    const x = event?.clientX ?? window.innerWidth - 40
    const y = event?.clientY ?? 40
    document.documentElement.style.setProperty('--vt-x', `${x}px`)
    document.documentElement.style.setProperty('--vt-y', `${y}px`)
    document.startViewTransition(() => flushSync(apply))
  }, [theme])

  const setLang = useCallback((next) => { setLangState(next); write('lang', next) }, [])

  const value = useMemo(() => ({ theme, toggleTheme, lang, setLang, t: content[lang] }), [theme, toggleTheme, lang, setLang])
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs must be used inside <PreferencesProvider>')
  return ctx
}