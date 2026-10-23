import { useCallback, useEffect, useState } from 'react'

export type Theme = 'pink' | 'grey'

const THEME_KEY = 'bad-mood:theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// Kept in sync with the --page token of each theme in styles.css.
const THEME_COLORS: Record<Theme, string> = {
  pink: '#f3eeea',
  grey: '#141516',
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'pink' || stored === 'grey' ? stored : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'grey' : 'pink'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme === 'grey' ? 'dark' : 'light'
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', THEME_COLORS[theme])
  })
}

/** Pink is the light edition of the pedal, grey the dark one. Follows the OS until the user picks one. */
export function useTheme() {
  const [stored, setStored] = useState<Theme | null>(readStoredTheme)
  const [system, setSystem] = useState<Theme>(systemTheme)
  const theme = stored ?? system

  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY)
    const update = () => setSystem(query.matches ? 'grey' : 'pink')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => applyTheme(theme), [theme])

  const setTheme = useCallback((next: Theme) => {
    setStored(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // The choice still applies for this visit.
    }
  }, [])

  return { theme, setTheme }
}
