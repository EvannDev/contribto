'use client'

import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('hc-theme', next ? 'dark' : 'light')
  }

  function handleAuth() {
    setLoading(true)
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`
    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&scope=read:user&redirect_uri=${encodeURIComponent(redirectUri)}`
    window.location.href = url
  }

  return (
    <>
      <style>{css}</style>
      <div className="login-page">
        {/* Back nav */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" className="back-btn">
            <ChevronLeftIcon />
            Back
          </a>
          <button className="theme-btn" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        {/* Centered content */}
        <div className="login-center">
          <div className="login-box">
            {/* Logo */}
            <div className="login-logo">Hello<span className="accent">Commit</span></div>

            {/* Card */}
            <div className="login-card">
              <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 8 }}>
                Sign in to continue
              </h1>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.55, marginBottom: 28 }}>
                We&apos;ll scan your starred repositories for good first issues. Read-only — we never touch your code.
              </p>

              <button
                onClick={handleAuth}
                disabled={loading}
                className="github-btn"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <><LoadingSpinner />Connecting…</>
                ) : (
                  <><GithubIcon size={16} />Continue with GitHub</>
                )}
              </button>

              <div className="access-note">
                <span style={{ fontWeight: 500, color: 'var(--fg-default)', fontSize: 12 }}>What we access:</span>
                {' '}
                <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>your public profile and starred repositories. That&apos;s it.</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="trust-row">
              <TrustItem icon="lock" text="No write access" />
              <TrustItem icon="eye-off" text="No private repos" />
              <TrustItem icon="code" text="Open source" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }

  .login-page {
    min-height: 100vh; display: flex; flex-direction: column;
    background: var(--bg-base);
  }
  .back-btn {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: var(--fg-muted); cursor: pointer;
    background: none; border: none; font-family: inherit; text-decoration: none;
    transition: color var(--transition-fast);
  }
  .back-btn:hover { color: var(--fg-default); }
  .theme-btn {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    background: transparent; color: var(--fg-muted); cursor: pointer;
  }
  .theme-btn:hover { background: var(--bg-hover); color: var(--fg-default); }
  .login-center {
    flex: 1; display: flex; align-items: center; justify-content: center;
    padding: 32px 24px;
  }
  .login-box { width: 100%; max-width: 360px; text-align: center; }
  .login-logo { font-weight: 600; font-size: 22px; letter-spacing: -0.02em; margin-bottom: 40px; }
  .accent { color: var(--accent-fg); }
  .login-card {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: 10px; padding: 32px 28px; text-align: left;
  }
  .github-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; height: 40px; padding: 0 20px;
    background: var(--accent); color: #fff; border: none;
    border-radius: var(--radius-md); font-family: inherit;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: background var(--transition-base);
  }
  .github-btn:hover:not(:disabled) { background: var(--accent-hover); }
  .github-btn:disabled { cursor: not-allowed; }
  .access-note {
    margin-top: 20px; padding: 12px 14px;
    background: var(--bg-surface-2); border-radius: 6px; line-height: 1.6;
  }
  .trust-row {
    margin-top: 20px; display: flex; align-items: center;
    justify-content: center; gap: 16px;
  }
  .trust-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--fg-subtle); }
  .loading-spinner { animation: spin 0.8s linear infinite; }
`

function TrustItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="trust-item">
      <TrustIcon name={icon} />
      {text}
    </div>
  )
}

function TrustIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    lock: <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />,
    'eye-off': (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" x2="23" y1="1" y2="23" />
      </>
    ),
    code: (
      <>
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </>
    ),
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      {paths[name]}
    </svg>
  )
}

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function LoadingSpinner() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loading-spinner">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}
