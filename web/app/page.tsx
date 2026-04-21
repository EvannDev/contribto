'use client'

import { useState, useEffect } from 'react'

const SAMPLE_ISSUES = [
  { title: 'Add support for dark mode in dashboard sidebar', repo: 'vercel/next.js', labels: [{ text: 'good first issue', bg: '#D1FAE5', fg: '#065F46' }], lang: 'TypeScript', age: '3 days ago' },
  { title: 'Fix: timezone handling in relative timestamps', repo: 'supabase/supabase', labels: [{ text: 'bug', bg: '#FEE2E2', fg: '#991B1B' }, { text: 'help wanted', bg: '#FEF3C7', fg: '#92400E' }], lang: 'TypeScript', age: '1 week ago' },
  { title: 'Improve CLI error messages for missing config', repo: 'oven-sh/bun', labels: [{ text: 'good first issue', bg: '#D1FAE5', fg: '#065F46' }, { text: 'enhancement', bg: '#EDE9FE', fg: '#5B21B6' }], lang: 'Zig', age: '2 days ago' },
]

const FAQ = [
  { q: 'What GitHub permissions do you need?', a: "Read-only access to your public starred repositories. We never request write access, and we never see your private repos." },
  { q: 'How often is it updated?', a: 'Issues are refreshed every few hours. New "good first issue" labels are picked up automatically.' },
  { q: 'Is it really free?', a: "Yes. This is a small open-source project, not a SaaS business. If that changes, you'll know before it does." },
  { q: 'What if I have no starred repos?', a: "Star some projects on GitHub first — anything you'd like to contribute to. Then come back and sign in." },
]

export default function LandingPage() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('ct-theme', next ? 'dark' : 'light')
  }

  return (
    <>
      <style>{css}</style>

      {/* Nav */}
      <nav className="landing-nav">
        <div className="logo">Contrib<span className="accent">.to</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="theme-btn" onClick={toggleDark} aria-label="Toggle dark mode">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <a href="https://github.com" className="nav-link">GitHub</a>
          <a href="/login" className="btn btn-primary btn-sm">Sign in</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '80px 32px 72px', textAlign: 'center' }}>
        <div className="eyebrow-badge">
          <span className="eyebrow-dot" />
          Open source · free to use
        </div>
        <h1 className="hero-headline">
          Find issues worth your time,<br />in repos you already starred.
        </h1>
        <p className="hero-sub">
          Contrib.to scans your GitHub stars and surfaces good first issues from projects you actually care about. No doomscrolling required.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/login" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <GithubIcon size={16} />
            Sign in with GitHub
          </a>
          <a href="#how" className="btn btn-secondary btn-lg">See how it works</a>
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-subtle)', marginTop: 16 }}>
          We only read your public stars. Nothing else.
        </p>
      </section>

      {/* How it works */}
      <section id="how" className="section-bordered" style={{ padding: '64px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 className="section-label">How it works</h2>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Connect GitHub', body: 'Sign in with GitHub OAuth. We request read-only access to your public starred repositories — nothing else.' },
              { n: '02', title: 'We scan your stars', body: 'Contrib.to checks each starred repo for open issues labeled "good first issue". Takes about 30 seconds.' },
              { n: '03', title: 'Browse and contribute', body: 'Get a curated feed of issues filtered by language, repo, or label. Click any issue to go straight to GitHub.' },
            ].map(s => (
              <div key={s.n}>
                <div className="step-num">{s.n}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-body">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="preview-section">
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 className="section-label">What you&apos;ll see</h2>
          <div className="preview-window">
            <div className="preview-bar">
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-dot" />
              <span className="preview-url">contrib.to/dashboard</span>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {SAMPLE_ISSUES.map((issue, i) => (
                <div key={i} className="mini-issue">
                  <IssueCircleIcon />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-default)', marginBottom: 4 }}>{issue.title}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="mono-tag">{issue.repo}</span>
                      {issue.labels.map(l => (
                        <span key={l.text} className="label-pill" style={{ background: l.bg, color: l.fg }}>{l.text}</span>
                      ))}
                      <span className="lang-pill">{issue.lang}</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>{issue.age}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section style={{ padding: '64px 32px', maxWidth: 680, margin: '0 auto' }}>
        <h2 className="section-label">Why this exists</h2>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--fg-default)', marginBottom: 16 }}>
          I wanted to contribute to open source but kept spending more time <em>looking</em> for issues than actually working on them. GitHub&apos;s issue search is fine, but it doesn&apos;t know what I care about.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--fg-muted)' }}>
          Your starred repos are a pretty good signal. You starred them for a reason. Contrib.to just connects the dots.
        </p>
      </section>

      {/* FAQ */}
      <section className="section-bordered" style={{ padding: '64px 32px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 className="section-label">FAQ</h2>
          <div>
            {FAQ.map((item, i) => (
              <div key={i} className="faq-item">
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 6 }}>{item.q}</div>
                <div style={{ fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span className="logo" style={{ fontSize: 14 }}>Contrib<span className="accent">.to</span></span>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="https://github.com" style={{ fontSize: 13, color: 'var(--fg-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <GithubIcon size={14} /> Source
          </a>
          <span style={{ fontSize: 13, color: 'var(--fg-subtle)' }}>Made with too much coffee.</span>
        </div>
      </footer>
    </>
  )
}

const css = `
  .landing-nav {
    position: sticky; top: 0; z-index: 100;
    background: var(--bg-base); border-bottom: 1px solid var(--border-default);
    padding: 0 32px; height: 52px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo { font-weight: 600; font-size: 16px; letter-spacing: -0.02em; }
  .accent { color: var(--accent-fg); }
  .nav-link { font-size: 13px; color: var(--fg-muted); padding: 4px 8px; }
  .nav-link:hover { color: var(--fg-default); }
  .theme-btn {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    background: transparent; color: var(--fg-muted); cursor: pointer;
  }
  .theme-btn:hover { background: var(--bg-hover); color: var(--fg-default); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    gap: 6px; border: none; border-radius: var(--radius-md);
    font-family: var(--font-sans, sans-serif); font-weight: 500; cursor: pointer;
    white-space: nowrap; transition: background var(--transition-base);
    text-decoration: none;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-secondary { background: var(--bg-surface); color: var(--fg-default); border: 1px solid var(--border-strong); }
  .btn-secondary:hover { background: var(--bg-hover); }
  .btn-sm { height: 28px; padding: 0 12px; font-size: 12px; }
  .btn-md { height: 34px; padding: 0 14px; font-size: 13px; }
  .btn-lg { height: 40px; padding: 0 20px; font-size: 14px; }

  .eyebrow-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-subtle); border: 1px solid var(--accent-muted);
    border-radius: 999px; padding: 3px 12px; font-size: 12px;
    color: var(--accent-fg); font-weight: 500; margin-bottom: 24px;
  }
  .eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); display: inline-block; }

  .hero-headline {
    font-size: clamp(32px, 5vw, 52px); font-weight: 600;
    letter-spacing: -0.025em; line-height: 1.1;
    color: var(--fg-default); margin-bottom: 20px;
  }
  .hero-sub {
    font-size: 17px; color: var(--fg-muted); line-height: 1.65;
    max-width: 520px; margin: 0 auto 36px;
  }

  .section-bordered { border-top: 1px solid var(--border-default); }
  .section-label {
    font-size: 13px; font-weight: 500; color: var(--fg-muted);
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 32px;
  }

  .steps-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 32px;
  }
  .step-num { font-family: var(--font-mono, monospace); font-size: 12px; color: var(--accent-fg); margin-bottom: 10px; }
  .step-title { font-size: 16px; font-weight: 600; color: var(--fg-default); margin-bottom: 8px; }
  .step-body { font-size: 14px; color: var(--fg-muted); line-height: 1.6; }

  .preview-section {
    background: var(--bg-surface-2);
    border-top: 1px solid var(--border-default);
    border-bottom: 1px solid var(--border-default);
    padding: 64px 32px;
  }
  .preview-window {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-lg);
  }
  .preview-bar {
    padding: 10px 14px; border-bottom: 1px solid var(--border-default);
    display: flex; align-items: center; gap: 6px;
  }
  .preview-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--neutral-200); }
  .preview-url {
    flex: 1; margin-left: 8px; background: var(--bg-surface-2); border-radius: 4px;
    height: 22px; display: flex; align-items: center; padding-left: 10px;
    font-size: 11px; color: var(--fg-subtle); font-family: var(--font-mono, monospace);
  }
  .mini-issue {
    display: flex; align-items: flex-start; gap: 10;
    padding: 10px 0; border-bottom: 1px solid var(--border-default);
  }
  .mini-issue:last-child { border-bottom: none; }
  .mono-tag { font-family: var(--font-mono, monospace); font-size: 11px; color: var(--fg-muted); }
  .label-pill {
    display: inline-block; padding: 1px 7px; border-radius: 999px;
    font-size: 11px; font-weight: 500; white-space: nowrap;
  }
  .lang-pill {
    font-family: var(--font-mono, monospace); font-size: 11px;
    background: var(--bg-surface-2); border: 1px solid var(--border-default);
    padding: 0 6px; border-radius: 999px; color: var(--fg-muted);
  }

  .faq-item { padding: 20px 0; border-bottom: 1px solid var(--border-default); }
  .faq-item:first-child { border-top: none; }

  .landing-footer {
    border-top: 1px solid var(--border-default); padding: 24px 32px;
    display: flex; align-items: center; justify-content: space-between;
  }
`

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function IssueCircleIcon() {
  return (
    <svg style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="1" />
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
