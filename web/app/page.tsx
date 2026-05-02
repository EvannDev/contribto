'use client'

import { useState, useEffect } from 'react'
import { Logo } from '@/components/logo'

// ── Data ──────────────────────────────────────────────────────

interface PreviewLabel { text: string; variant: 'gfi' | 'blue' | 'orange' | 'purple' | 'lang' }
interface PreviewIssue { repo: string; title: string; labels: PreviewLabel[]; age: string; comments: number; num: string }

const PREVIEW_ISSUES: PreviewIssue[] = [
  {
    repo: 'vercel / next.js',
    title: 'Add missing aria-label to <Link> component when href is a URL object',
    labels: [{ text: 'good first issue', variant: 'gfi' }, { text: 'TypeScript', variant: 'lang' }],
    age: '2d ago', comments: 4, num: '#68421',
  },
  {
    repo: 'trpc / trpc',
    title: 'Document how to use tRPC with React Server Components in Next 14',
    labels: [{ text: 'good first issue', variant: 'gfi' }, { text: 'documentation', variant: 'blue' }, { text: 'TypeScript', variant: 'lang' }],
    age: '5d ago', comments: 11, num: '#5621',
  },
  {
    repo: 'biomejs / biome',
    title: 'Add lint rule: no-unnecessary-type-assertion for trivially inferable types',
    labels: [{ text: 'good first issue', variant: 'gfi' }, { text: 'enhancement', variant: 'orange' }, { text: 'Rust', variant: 'lang' }],
    age: '1d ago', comments: 2, num: '#3142',
  },
]

const WHY_CARDS = [
  {
    head: "You've starred 200 repos and never opened a PR",
    body: "Your GitHub stars are a record of projects you find interesting. Contrib.to turns that interest into actionable contribution opportunities, from repos you already trust.",
  },
  {
    head: "You're not new to code, just new to contributing",
    body: "Good first issues aren't just for beginners. They're often real bugs, small features, or doc improvements in projects you use every day. Low barrier to entry, real impact.",
  },
  {
    head: "You want to build a track record, not a portfolio",
    body: "Open-source contributions are a genuine signal. A merged PR in a repo with 10k stars says more than any side project. We help you find the ones worth your time.",
  },
  {
    head: "This is a small project, not a startup",
    body: "Contrib.to is a tool built by a developer who had the same problem. It's not VC-backed, not 'AI-powered', not going to upsell you a Pro plan. It just does one thing, hopefully well.",
  }
]

interface FAQItem { q: string; a: React.ReactNode }
const FAQ: FAQItem[] = [
  {
    q: 'What GitHub permissions do you request?',
    a: <>We request <code>read:user</code> and the public starred repos scope only. We can&apos;t see your private repositories, your commits, your email, or anything else. You can revoke access from your GitHub settings at any time.</>,
  },
  {
    q: 'Do you store my GitHub data?',
    a: "We store your GitHub username and a list of your starred repos. We also store issue metadata (title, URL, labels) from those repos to serve your dashboard — this data is kept until the issue is closed on GitHub or you delete your account. We never store issue body content, comments, or any private data.",
  },
  {
    q: "What if I don't have many starred repos?",
    a: "The fewer stars you have, the more focused the results. With 10 starred repos, you'll see issues from those 10 projects specifically — which might actually be more useful than a firehose of 300.",
  },
  {
    q: 'Is this free?',
    a: "Yes. There's no pricing plan, no free tier limits, no “upgrade for more results.” It's a small project running on cheap infrastructure. If that ever changes, I'll say so clearly.",
  },
  {
    q: 'What counts as a “good first issue”?',
    a: <>We filter for issues with the <code>good first issue</code>, <code>good-first-issue</code>, <code>beginner-friendly</code>, or <code>help wanted</code> labels. We also filter out issues that are already assigned, closed, or older than 6 months.</>,
  },
]

// ── Page ──────────────────────────────────────────────────────

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
    <div className="hcl">
      <style>{css}</style>

      {/* ── Nav ── */}
      <nav className="hcl-nav">
        <div className="hcl-nav__inner">
          <Logo className="hcl-logo" iconSize={18} />
          <div className="hcl-nav__actions">
            <button className="hcl-theme-btn" onClick={toggleDark} aria-label="Toggle dark mode">
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <a href="/login" className="hcl-btn hcl-btn--primary">Sign in with GitHub</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hcl-hero">
        <div className="hcl-container">
          <p className="hcl-eyebrow">// good first issues, from repos you actually care about</p>
          <h1 className="hcl-headline">
            Stop hunting.<br />
            Start <em>contributing</em>.
          </h1>
          <p className="hcl-sub">
            We look at the GitHub repos you&apos;ve already starred and surface beginner-friendly issues from them.
            That&apos;s it. No algorithm, no recommendations engine, no &ldquo;AI-curated&rdquo; anything.
          </p>
          <div className="hcl-cta-row">
            <a href="/login" className="hcl-btn hcl-btn--github">
              <GithubIcon />
              Sign in with GitHub
            </a>
            <a href="/dashboard" className="hcl-btn hcl-btn--outline">See a demo</a>
          </div>
          <p className="hcl-hero-note">// free. no credit card. we only read your public stars.</p>

          {/* Preview window */}
          <div className="hcl-preview">
            <div className="hcl-preview__bar">
              <span className="hcl-preview__dot" />
              <span className="hcl-preview__dot" />
              <span className="hcl-preview__dot" />
              <span className="hcl-preview__url">contrib.to/dashboard</span>
            </div>
            <div className="hcl-preview__body">
              <div className="hcl-preview__filter-row">
                <span className="hcl-mono-xs">23 issues · filtered by: TypeScript, good first issue</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="hcl-badge hcl-badge--lang">TypeScript</span>
                  <span className="hcl-badge hcl-badge--gfi">good first issue</span>
                </div>
              </div>
              {PREVIEW_ISSUES.map((issue, i) => (
                <div
                  key={i}
                  className={`hcl-issue-card${i === 0 ? ' hcl-issue-card--first' : ''}${i === PREVIEW_ISSUES.length - 1 ? ' hcl-issue-card--last' : ''}`}
                >
                  <div className="hcl-issue-card__left">
                    <span className="hcl-issue-card__repo">{issue.repo}</span>
                    <span className="hcl-issue-card__title">{issue.title}</span>
                    <div className="hcl-issue-card__meta">
                      {issue.labels.map((l, j) => (
                        <span key={j} className={`hcl-badge hcl-badge--${l.variant}`}>{l.text}</span>
                      ))}
                      <span className="hcl-meta-item"><ClockIcon />{issue.age}</span>
                      <span className="hcl-meta-item"><CommentIcon />{issue.comments}</span>
                    </div>
                  </div>
                  <div className="hcl-issue-card__right">
                    <span className="hcl-mono-xs">{issue.num}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="hcl-section">
        <div className="hcl-container">
          <p className="hcl-section-label">// how it works</p>
          <h2 className="hcl-section-heading">Three steps, no magic.</h2>
          <p className="hcl-section-sub">We&apos;re not doing anything fancy. The value is in the curation, not the technology.</p>
          <div className="hcl-steps">
            <div className="hcl-step">
              <p className="hcl-step__num">01</p>
              <p className="hcl-step__title">Sign in with GitHub</p>
              <p className="hcl-step__body">OAuth only. We request the minimum scope needed — read your public starred repos. We don&apos;t touch your private repos, your code, or your email.</p>
            </div>
            <div className="hcl-step">
              <p className="hcl-step__num">02</p>
              <p className="hcl-step__title">We scan your stars</p>
              <p className="hcl-step__body">We fetch issues from the repos you&apos;ve starred, filtering to anything labeled <code className="hcl-code">good first issue</code> or <code className="hcl-code">beginner-friendly</code>. No open issues older than 6 months.</p>
            </div>
            <div className="hcl-step">
              <p className="hcl-step__num">03</p>
              <p className="hcl-step__title">Browse and filter</p>
              <p className="hcl-step__body">Sort by recency, filter by language or label. Click an issue to open it directly on GitHub. That&apos;s where the real work happens — we just get you there.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="hcl-section">
        <div className="hcl-container">
          <p className="hcl-section-label">// who this is for</p>
          <h2 className="hcl-section-heading">For developers who want to contribute<br />but don&apos;t know where to start.</h2>
          <div className="hcl-why-grid">
            {WHY_CARDS.map((card, i) => (
              <div key={i} className="hcl-why-card">
                <p className="hcl-why-card__head">{card.head}</p>
                <p className="hcl-why-card__body">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="hcl-section">
        <div className="hcl-container">
          <p className="hcl-section-label">// questions</p>
          <h2 className="hcl-section-heading">Honest answers.</h2>
          <div className="hcl-faq">
            {FAQ.map((item, i) => (
              <details key={i} className="hcl-faq__item">
                <summary className="hcl-faq__q">
                  {item.q}
                  <PlusIcon />
                </summary>
                <div className="hcl-faq__a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="hcl-cta-strip">
        <div className="hcl-container">
          <h2 className="hcl-cta-strip__heading">Ready to ship your first PR?</h2>
          <p className="hcl-cta-strip__sub">Takes 30 seconds to connect. No setup, no config, no docs to read.</p>
          <a href="/login" className="hcl-btn hcl-btn--github" style={{ display: 'inline-flex' }}>
            <GithubIcon />
            Sign in with GitHub
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="hcl-footer">
        <div className="hcl-container">
          <div className="hcl-footer__inner">
            <span className="hcl-footer__copy">contrib.to — made by a developer, for developers</span>
            <div className="hcl-footer__links">
              <a href="https://github.com/EvannDev/contribto" className="hcl-footer__link">GitHub</a>
              <a href="/privacy" className="hcl-footer__link">Privacy</a>
              <a href="/terms" className="hcl-footer__link">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 1a6.5 6.5 0 100 13A6.5 6.5 0 007.5 1zm.5 7H5V7h3V4h1v4z" fill="currentColor" />
    </svg>
  )
}

function CommentIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 15 15" fill="none">
      <path d="M1 7.5C1 4 4 1 7.5 1S14 4 14 7.5c0 1.6-.57 3.07-1.5 4.22V13l-2-1a6.44 6.44 0 01-3 .5C4 12.5 1 10.5 1 7.5z" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
      <path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
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

// ── CSS ───────────────────────────────────────────────────────

const css = `
  /* Root — design token overrides for the landing scope */
  .hcl {
    --accent-fg: var(--hc-accent);
    background: var(--hc-bg);
    color: var(--hc-text);
    font-family: var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
    min-height: 100vh;
  }

  /* Container */
  .hcl-container { max-width: 960px; margin: 0 auto; padding: 0 24px; }

  /* Nav */
  .hcl-nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--hc-bg-overlay);
    border-bottom: 1px solid var(--hc-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .hcl-nav__inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 52px; max-width: 960px; margin: 0 auto; padding: 0 24px;
  }
  .hcl-logo {
    font-family: var(--font-mono, monospace);
    font-size: 13px; font-weight: 500; letter-spacing: -0.01em;
  }
  .hcl-nav__actions { display: flex; align-items: center; gap: 12px; }

  /* Theme button */
  .hcl-theme-btn {
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--hc-border); border-radius: 6px;
    color: var(--hc-text-muted); background: transparent; cursor: pointer;
    transition: background 120ms, color 120ms;
  }
  .hcl-theme-btn:hover { background: var(--hc-bg-subtle); color: var(--hc-text); }

  /* Buttons */
  .hcl-btn {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: var(--font-sans, sans-serif); font-size: 13px; font-weight: 500;
    padding: 7px 16px; border-radius: 6px;
    transition: background 120ms, border-color 120ms, color 120ms;
    white-space: nowrap; cursor: pointer; text-decoration: none;
  }
  .hcl-btn--primary {
    background: var(--hc-text); color: var(--hc-bg);
    border: 1px solid var(--hc-text);
  }
  .hcl-btn--primary:hover { background: var(--hc-accent); border-color: var(--hc-accent); color: #fff; }
  .hcl-btn--github {
    background: var(--hc-text); color: var(--hc-bg);
    border: 1px solid var(--hc-text);
    font-size: 15px; padding: 11px 24px; gap: 10px;
  }
  .hcl-btn--github:hover { background: var(--hc-accent); border-color: var(--hc-accent); color: #fff; }
  .hcl-btn--github svg { flex-shrink: 0; }
  .hcl-btn--outline {
    background: transparent; color: var(--hc-text);
    border: 1px solid var(--hc-border-strong);
    font-size: 15px; padding: 11px 24px;
  }
  .hcl-btn--outline:hover { border-color: var(--hc-text); }

  /* Hero */
  .hcl-hero { padding: 96px 0 80px; border-bottom: 1px solid var(--hc-border-subtle); }
  .hcl-eyebrow {
    font-family: var(--font-mono, monospace); font-size: 11px;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--hc-text-subtle); margin-bottom: 20px;
  }
  .hcl-headline {
    font-size: clamp(36px, 5vw, 60px);
    font-weight: 600; line-height: 1.1; letter-spacing: -0.03em;
    color: var(--hc-text); max-width: 700px; margin-bottom: 20px;
  }
  .hcl-headline em { font-style: normal; color: var(--hc-accent); }
  .hcl-sub {
    font-size: 17px; color: var(--hc-text-muted);
    max-width: 480px; line-height: 1.65; margin-bottom: 32px;
  }
  .hcl-cta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .hcl-hero-note {
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--hc-text-subtle); margin-top: 16px;
  }

  /* Preview window */
  .hcl-preview {
    margin-top: 48px;
    border: 1px solid var(--hc-border); border-radius: 10px;
    background: var(--hc-bg-subtle); overflow: hidden;
    box-shadow: 0 8px 24px rgba(28,25,23,0.10), 0 2px 6px rgba(28,25,23,0.05);
  }
  [data-theme="dark"] .hcl-preview {
    box-shadow: 0 8px 24px rgba(0,0,0,0.34), 0 2px 6px rgba(0,0,0,0.16);
  }
  .hcl-preview__bar {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px; background: var(--hc-bg); border-bottom: 1px solid var(--hc-border);
  }
  .hcl-preview__dot { width: 10px; height: 10px; border-radius: 50%; background: var(--hc-border-strong); flex-shrink: 0; }
  .hcl-preview__url {
    flex: 1; font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--hc-text-subtle); padding: 3px 10px;
    background: var(--hc-bg-subtle); border: 1px solid var(--hc-border); border-radius: 4px;
  }
  .hcl-preview__body { padding: 16px; }
  .hcl-preview__filter-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
  }

  /* Issue cards (preview) */
  .hcl-issue-card {
    display: grid; grid-template-columns: 1fr auto; gap: 16px;
    padding: 14px 16px;
    border: 1px solid var(--hc-border); border-bottom: none;
    background: var(--hc-bg); transition: background 120ms; cursor: pointer;
  }
  .hcl-issue-card--first { border-radius: 6px 6px 0 0; }
  .hcl-issue-card--last { border-bottom: 1px solid var(--hc-border); border-radius: 0 0 6px 6px; }
  .hcl-issue-card:hover { background: var(--hc-bg-subtle); }
  .hcl-issue-card__left { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .hcl-issue-card__repo {
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--hc-text-muted); letter-spacing: -0.01em;
  }
  .hcl-issue-card__title { font-size: 13px; font-weight: 500; color: var(--hc-text); line-height: 1.4; }
  .hcl-issue-card__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .hcl-issue-card__right { display: flex; align-items: flex-start; flex-shrink: 0; }

  /* Badges */
  .hcl-badge {
    display: inline-flex; align-items: center;
    font-family: var(--font-mono, monospace); font-size: 10px; font-weight: 500;
    padding: 2px 7px; border-radius: 9999px; border: 1px solid; white-space: nowrap;
  }
  .hcl-badge--lang { background: var(--hc-bg-subtle); border-color: var(--hc-border); color: var(--hc-text-muted); }
  .hcl-badge--gfi  { background: #edf7f0; border-color: #2d7a45; color: #2d7a45; }
  .hcl-badge--blue { background: #eff6ff; border-color: #1e5fad; color: #1e5fad; }
  .hcl-badge--orange { background: var(--hc-accent-subtle); border-color: var(--hc-accent-border); color: var(--hc-accent); }
  .hcl-badge--purple { background: #f3f0fb; border-color: #7c3aed; color: #6d28d9; }
  [data-theme="dark"] .hcl-badge--gfi    { background: #0a1f12; border-color: #4ade80; color: #4ade80; }
  [data-theme="dark"] .hcl-badge--blue   { background: #0a1228; border-color: #60a5fa; color: #60a5fa; }
  [data-theme="dark"] .hcl-badge--purple { background: #180e2a; border-color: #a78bfa; color: #a78bfa; }

  /* Meta */
  .hcl-meta-item {
    font-family: var(--font-mono, monospace); font-size: 11px; color: var(--hc-text-subtle);
    display: flex; align-items: center; gap: 4px;
  }
  .hcl-mono-xs { font-family: var(--font-mono, monospace); font-size: 11px; color: var(--hc-text-subtle); }

  /* Sections */
  .hcl-section { padding: 80px 0; border-bottom: 1px solid var(--hc-border-subtle); }
  .hcl-section-label {
    font-family: var(--font-mono, monospace); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--hc-text-subtle); margin-bottom: 16px;
  }
  .hcl-section-heading {
    font-size: 30px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.2;
    color: var(--hc-text); margin-bottom: 12px;
  }
  .hcl-section-sub { font-size: 15px; color: var(--hc-text-muted); max-width: 480px; line-height: 1.65; }

  /* Steps */
  .hcl-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
  .hcl-step { padding: 24px; border: 1px solid var(--hc-border); border-radius: 10px; background: var(--hc-bg); }
  .hcl-step__num {
    font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 500;
    color: var(--hc-accent); letter-spacing: 0.04em; margin-bottom: 16px;
  }
  .hcl-step__title { font-size: 15px; font-weight: 600; color: var(--hc-text); margin-bottom: 8px; }
  .hcl-step__body { font-size: 13px; color: var(--hc-text-muted); line-height: 1.65; }
  .hcl-code {
    font-family: var(--font-mono, monospace); font-size: 11px;
    background: var(--hc-bg-subtle); border: 1px solid var(--hc-border);
    border-radius: 3px; padding: 1px 5px; color: var(--hc-text-muted);
  }

  /* Why grid */
  .hcl-why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
  .hcl-why-card { padding: 24px; border: 1px solid var(--hc-border); border-radius: 10px; background: var(--hc-bg); }
  .hcl-why-card__head { font-size: 13px; font-weight: 600; color: var(--hc-text); margin-bottom: 8px; }
  .hcl-why-card__body { font-size: 13px; color: var(--hc-text-muted); line-height: 1.65; }

  /* FAQ */
  .hcl-faq { margin-top: 32px; }
  .hcl-faq__item { border-top: 1px solid var(--hc-border); }
  .hcl-faq__item:last-child { border-bottom: 1px solid var(--hc-border); }
  .hcl-faq__q {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 0; font-size: 15px; font-weight: 500;
    cursor: pointer; list-style: none; color: var(--hc-text);
  }
  .hcl-faq__q::-webkit-details-marker { display: none; }
  .hcl-faq__q svg { flex-shrink: 0; color: var(--hc-text-subtle); transition: transform 200ms cubic-bezier(0.16,1,0.3,1); }
  details[open] .hcl-faq__q svg { transform: rotate(45deg); }
  .hcl-faq__a {
    padding-bottom: 20px; font-size: 13px; color: var(--hc-text-muted); line-height: 1.65; max-width: 640px;
  }
  .hcl-faq__a code {
    font-family: var(--font-mono, monospace); font-size: 11px;
    background: var(--hc-bg-subtle); border: 1px solid var(--hc-border);
    border-radius: 3px; padding: 1px 5px;
  }

  /* CTA strip */
  .hcl-cta-strip { padding: 64px 0; border-bottom: 1px solid var(--hc-border-subtle); text-align: center; }
  .hcl-cta-strip__heading {
    font-size: 30px; font-weight: 600; letter-spacing: -0.03em; margin-bottom: 12px; color: var(--hc-text);
  }
  .hcl-cta-strip__sub { font-size: 15px; color: var(--hc-text-muted); margin-bottom: 32px; }

  /* Footer */
  .hcl-footer { padding: 32px 0; }
  .hcl-footer__inner {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--hc-border-subtle); padding-top: 32px;
  }
  .hcl-footer__copy { font-family: var(--font-mono, monospace); font-size: 11px; color: var(--hc-text-subtle); }
  .hcl-footer__links { display: flex; gap: 20px; }
  .hcl-footer__link {
    font-family: var(--font-mono, monospace); font-size: 11px; color: var(--hc-text-subtle);
    transition: color 120ms;
  }
  .hcl-footer__link:hover { color: var(--hc-text); }

  /* Responsive */
  @media (max-width: 680px) {
    .hcl-steps { grid-template-columns: 1fr; }
    .hcl-why-grid { grid-template-columns: 1fr; }
    .hcl-footer__inner { flex-direction: column; gap: 16px; text-align: center; }
    .hcl-headline { font-size: 32px; }
    .hcl-preview__filter-row { flex-direction: column; align-items: flex-start; }
    .hcl-hero { padding: 64px 0 48px; }
  }
`
