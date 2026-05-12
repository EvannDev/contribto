'use client'

import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('ct-theme', next ? 'dark' : 'light')
  }

  return (
    <button className="hcl-theme-btn" onClick={toggle} aria-label="Toggle dark mode">
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h-1M13.5 7.5h1M3.4 3.4l-.7-.7M11.6 11.6l.7.7M11.6 3.4l.7-.7M3.4 11.6l-.7.7M7.5 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M2.9 8.5A5 5 0 007.5 13a5 5 0 005-5A5 5 0 007.5 3a5.3 5.3 0 00-1 .1A4 4 0 012.9 8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
