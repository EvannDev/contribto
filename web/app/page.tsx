import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

// ── Types ─────────────────────────────────────────────────────

interface PreviewLabel { text: string; variant: 'gfi' | 'blue' | 'orange' | 'purple' | 'lang' }
interface PreviewIssue { repo: string; title: string; labels: PreviewLabel[]; age: string; comments: number; num: string }

// ── Data ──────────────────────────────────────────────────────

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
    labels: [{ text: 'good first issue', variant: 'gfi' }, { text: 'docs', variant: 'blue' }, { text: 'TypeScript', variant: 'lang' }],
    age: '5d ago', comments: 11, num: '#5621',
  },
  {
    repo: 'biomejs / biome',
    title: 'Add lint rule: no-unnecessary-type-assertion for trivially inferable types',
    labels: [{ text: 'good first issue', variant: 'gfi' }, { text: 'enhancement', variant: 'orange' }, { text: 'Rust', variant: 'lang' }],
    age: '1d ago', comments: 2, num: '#3142',
  },
]

const HOW_STEPS = [
  {
    num: '01',
    title: 'Connect GitHub',
    body: 'OAuth read-only. We request the bare minimum — access to your public starred repos, nothing else, ever.',
  },
  {
    num: '02',
    title: 'We do the scan',
    body: 'We pull issues from your starred repos, keep only beginner-friendly ones, and drop anything stale or already claimed.',
  },
  {
    num: '03',
    title: 'You ship the PR',
    body: 'Filter by language or label, click to open on GitHub. We get you to the right issue — you take it from there.',
  },
]

const FEATURES = [
  {
    title: 'From repos you already trust',
    body: "Every result comes from a project you chose to star. No recommendations engine, no trending noise, no repos you've never heard of.",
  },
  {
    title: 'Minimum permissions, maximum transparency',
    body: 'We read your public stars. That is it. No private repos, no commits, no email. Revoke OAuth access from GitHub settings at any time.',
  },
  {
    title: 'A short list, not a firehose',
    body: 'Issues must be open, unassigned, labeled as beginner-friendly, and under 6 months old. The list stays short and actionable on purpose.',
  },
  {
    title: 'Free with no catches',
    body: "No plans, no limits, no upgrade prompt. Small tool, cheap infrastructure, no VC to answer to. If that ever changes, I'll say so plainly.",
  },
]

interface FAQItem { q: string; a: React.ReactNode; aText?: string }

const FAQ: FAQItem[] = [
  {
    q: 'What GitHub permissions do you request?',
    a: <>We request <code className="lp-code">read:user</code> and the public starred repos scope only. We cannot see your private repositories, your commits, your email, or anything else. You can revoke access from your GitHub settings at any time.</>,
    aText: `We request read:user and the public starred repos scope only. We can't see private repos, commits, email, or anything else.`,
  },
  {
    q: 'Do you store my GitHub data?',
    a: 'We store your GitHub username and a list of your starred repos. We also store issue metadata (title, URL, labels) from those repos — kept until the issue closes on GitHub or you delete your account. We never store issue body content, comments, or any private data.',
    aText: `We store your username, starred repos list, and issue metadata. No private data, no issue body content, no comments.`,
  },
  {
    q: "What if I don't have many starred repos?",
    a: 'Fewer stars means more focused results. With 10 starred repos you see issues from those 10 projects specifically — often more useful than a firehose of 300.',
    aText: `Fewer stars means more focused results. 10 starred repos gives you 10 targeted projects.`,
  },
  {
    q: 'Is this free?',
    a: "Yes. No pricing plan, no free tier limits, no upgrade prompt. Small project, cheap infrastructure. If that ever changes, I'll say so clearly.",
    aText: `Yes. No plans, no limits, no upgrade prompt.`,
  },
  {
    q: 'What counts as a "good first issue"?',
    a: <>We filter for <code className="lp-code">good first issue</code>, <code className="lp-code">good-first-issue</code>, <code className="lp-code">beginner-friendly</code>, and <code className="lp-code">help wanted</code> labels. We also exclude issues that are already assigned, closed, or older than 6 months.</>,
    aText: 'Labels: good first issue, good-first-issue, beginner-friendly, help wanted. Excludes assigned, closed, or stale issues.',
  },
]

// ── Page ──────────────────────────────────────────────────────

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(item => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.aText ?? '' },
  })),
}

export default function LandingPage() {
  return (
    <div className="lp">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <style>{css}</style>

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav__inner">
          <Logo className="lp-logo" iconSize={18} />
          <div className="lp-nav__actions">
            <ThemeToggle />
            <a href="/login" className="lp-btn lp-btn--nav">Sign in</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-container">
          <div className="lp-hero__grid">

            <div className="lp-hero__text">
              <div className="lp-tag">
                <TagDot />
                open source contributions, from repos you care about
              </div>
              <h1 className="lp-headline">
                Stop hunting for<br />
                issues.{' '}
                <span className="lp-headline__accent">Start shipping</span>{' '}
                PRs.
              </h1>
              <p className="lp-sub">
                Connect GitHub once. We scan the repos you&apos;ve already starred
                and surface beginner-friendly issues — no algorithm, no noise,
                no repos you&apos;ve never heard of.
              </p>
              <div className="lp-cta-row">
                <a href="/login" className="lp-btn lp-btn--cta">
                  <GithubIcon />
                  Sign in with GitHub
                </a>
                <a href="/dashboard" className="lp-btn lp-btn--ghost">View demo</a>
              </div>
              <div className="lp-trust">
                <span>Free</span>
                <TrustDot />
                <span>Read-only OAuth</span>
                <TrustDot />
                <span>No private data</span>
              </div>
            </div>

            <div className="lp-hero__visual">
              <div className="lp-preview">
                <div className="lp-preview__bar">
                  <div className="lp-preview__dots">
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                    <span aria-hidden="true" />
                  </div>
                  <span className="lp-preview__url">contrib.to/dashboard</span>
                </div>
                <div className="lp-preview__body">
                  <div className="lp-preview__filter-row">
                    <span className="lp-preview__count">23 issues · TypeScript, good first issue</span>
                    <div className="lp-preview__badges">
                      <span className="lp-badge lp-badge--lang">TypeScript</span>
                      <span className="lp-badge lp-badge--gfi">good first issue</span>
                    </div>
                  </div>
                  {PREVIEW_ISSUES.map((issue, i) => (
                    <div
                      key={i}
                      className={`lp-issue${i === 0 ? ' lp-issue--first' : ''}${i === PREVIEW_ISSUES.length - 1 ? ' lp-issue--last' : ''}`}
                    >
                      <div className="lp-issue__left">
                        <span className="lp-issue__repo">{issue.repo}</span>
                        <span className="lp-issue__title">{issue.title}</span>
                        <div className="lp-issue__meta">
                          {issue.labels.map((l, j) => (
                            <span key={j} className={`lp-badge lp-badge--${l.variant}`}>{l.text}</span>
                          ))}
                          <span className="lp-issue__age">{issue.age}</span>
                        </div>
                      </div>
                      <span className="lp-issue__num">{issue.num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section lp-section--tinted">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-label">How it works</p>
            <h2 className="lp-section-heading">Three steps. No magic.</h2>
          </div>
          <div className="lp-steps">
            {HOW_STEPS.map(step => (
              <div key={step.num} className="lp-step">
                <span className="lp-step__num" aria-hidden="true">{step.num}</span>
                <h3 className="lp-step__title">{step.title}</h3>
                <p className="lp-step__body">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-label">Why it works</p>
            <h2 className="lp-section-heading">
              Relevance beats volume,<br />every time.
            </h2>
          </div>
          <div className="lp-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature">
                <FeatureDiamond />
                <div>
                  <p className="lp-feature__title">{f.title}</p>
                  <p className="lp-feature__body">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-section lp-section--tinted">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-label">Questions</p>
            <h2 className="lp-section-heading">Straight answers.</h2>
          </div>
          <div className="lp-faq">
            {FAQ.map((item, i) => (
              <details key={i} className="lp-faq__item">
                <summary className="lp-faq__q">
                  {item.q}
                  <ChevronIcon />
                </summary>
                <div className="lp-faq__a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="lp-cta-strip">
        <div className="lp-container">
          <div className="lp-cta-strip__inner">
            <div>
              <h2 className="lp-cta-strip__heading">Ready to open your first PR?</h2>
              <p className="lp-cta-strip__sub">30 seconds to connect. No setup, no config, no onboarding flow to sit through.</p>
            </div>
            <a href="/login" className="lp-btn lp-btn--cta-strip">
              <GithubIcon />
              Sign in with GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer__inner">
            <span className="lp-footer__copy">contrib.to — a small tool, built by a developer</span>
            <div className="lp-footer__links">
              <a href="https://github.com/EvannDev/contribto" className="lp-footer__link">GitHub</a>
              <a href="/privacy" className="lp-footer__link">Privacy</a>
              <a href="/terms" className="lp-footer__link">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── Icons & SVG ───────────────────────────────────────────────

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="lp-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FeatureDiamond() {
  return (
    <svg className="lp-feature__icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1l3.5 7.5L9 17 5.5 8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
    </svg>
  )
}

function TagDot() {
  return (
    <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
      <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
  )
}

function TrustDot() {
  return <span aria-hidden="true" className="lp-trust-dot" />
}

// ── CSS ───────────────────────────────────────────────────────

const css = `
  /* ── Design tokens ── */
  .lp {
    --lp-bg:            #FAFBFC;
    --lp-bg-subtle:     #F3F4F7;
    --lp-bg-tinted:     #F0F1F5;
    --lp-bg-overlay:    rgba(250,251,252,0.92);
    --lp-text:          #0F1623;
    --lp-text-muted:    #4B5263;
    --lp-text-subtle:   #8F97A8;
    --lp-border:        #E4E6EC;
    --lp-border-strong: #CDD0DB;
    --lp-accent:        #6366F1;
    --lp-accent-hover:  #4F46E5;
    --lp-accent-subtle: #EEF2FF;
    --lp-accent-muted:  #C7D2FE;
    --lp-green:         #059669;
    --lp-green-subtle:  #D1FAE5;
    --lp-green-border:  #A7F3D0;
    --lp-blue:          #1D4ED8;
    --lp-blue-subtle:   #DBEAFE;
    --lp-blue-border:   #BFDBFE;
    --lp-orange:        #C2410C;
    --lp-orange-subtle: #FEF3C7;
    --lp-orange-border: #FDE68A;

    background: var(--lp-bg);
    color: var(--lp-text);
    font-family: var(--font-sans, -apple-system, system-ui, sans-serif);
    min-height: 100vh;
  }

  [data-theme="dark"] .lp {
    --lp-bg:            #080A0F;
    --lp-bg-subtle:     #0D1018;
    --lp-bg-tinted:     #0B0D15;
    --lp-bg-overlay:    rgba(8,10,15,0.92);
    --lp-text:          #F0F2F8;
    --lp-text-muted:    #8F97A8;
    --lp-text-subtle:   #505867;
    --lp-border:        #1A1D28;
    --lp-border-strong: #252835;
    --lp-accent:        #818CF8;
    --lp-accent-hover:  #6366F1;
    --lp-accent-subtle: rgba(129,140,248,0.10);
    --lp-accent-muted:  rgba(129,140,248,0.25);
    --lp-green:         #34D399;
    --lp-green-subtle:  rgba(52,211,153,0.10);
    --lp-green-border:  rgba(52,211,153,0.22);
    --lp-blue:          #60A5FA;
    --lp-blue-subtle:   rgba(96,165,250,0.10);
    --lp-blue-border:   rgba(96,165,250,0.22);
    --lp-orange:        #FBBF24;
    --lp-orange-subtle: rgba(251,191,36,0.10);
    --lp-orange-border: rgba(251,191,36,0.22);
  }

  /* ── Container ── */
  .lp-container { max-width: 1080px; margin: 0 auto; padding: 0 24px; }

  /* ── Nav ── */
  .lp-nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--lp-bg-overlay);
    border-bottom: 1px solid var(--lp-border);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .lp-nav__inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 54px; max-width: 1080px; margin: 0 auto; padding: 0 24px;
  }
  .lp-logo {
    font-family: var(--font-mono, monospace);
    font-size: 13px; font-weight: 500;
  }
  .lp-nav__actions { display: flex; align-items: center; gap: 10px; }

  /* ── Buttons ── */
  .lp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500;
    padding: 7px 16px; border-radius: 7px;
    border: 1px solid transparent;
    cursor: pointer; text-decoration: none; white-space: nowrap;
    transition: background 120ms, border-color 120ms, color 120ms, box-shadow 120ms;
  }
  .lp-btn--nav {
    background: var(--lp-text); color: var(--lp-bg);
    border-color: var(--lp-text);
  }
  .lp-btn--nav:hover { background: var(--lp-accent); border-color: var(--lp-accent); color: #fff; }
  .lp-btn--cta {
    background: var(--lp-accent); color: #fff;
    border-color: var(--lp-accent);
    font-size: 15px; padding: 12px 22px; border-radius: 8px; gap: 10px;
    box-shadow: 0 1px 3px rgba(99,102,241,0.25);
  }
  .lp-btn--cta:hover { background: var(--lp-accent-hover); border-color: var(--lp-accent-hover); box-shadow: 0 2px 8px rgba(99,102,241,0.35); }
  .lp-btn--ghost {
    background: transparent; color: var(--lp-text-muted);
    border-color: var(--lp-border-strong);
    font-size: 15px; padding: 12px 22px; border-radius: 8px;
  }
  .lp-btn--ghost:hover { border-color: var(--lp-text); color: var(--lp-text); }
  .lp-btn--cta-strip {
    background: #fff; color: var(--lp-accent);
    border-color: rgba(255,255,255,0.25);
    font-size: 15px; padding: 12px 22px; border-radius: 8px; gap: 10px;
    flex-shrink: 0; font-weight: 600;
  }
  .lp-btn--cta-strip:hover { background: var(--lp-accent-subtle); border-color: var(--lp-accent-subtle); }

  /* ── Hero ── */
  .lp-hero {
    padding: 80px 0 72px;
    border-bottom: 1px solid var(--lp-border);
    position: relative; overflow: hidden;
  }
  .lp-hero::after {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 75% 40%, rgba(99,102,241,0.07) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 85% 80%, rgba(129,140,248,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
  [data-theme="dark"] .lp-hero::after {
    background:
      radial-gradient(ellipse 60% 50% at 75% 40%, rgba(129,140,248,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 85% 80%, rgba(129,140,248,0.04) 0%, transparent 60%);
  }

  .lp-hero__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: center;
    position: relative; z-index: 1;
  }

  /* Tag */
  .lp-tag {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--lp-accent);
    background: var(--lp-accent-subtle);
    border: 1px solid var(--lp-accent-muted);
    padding: 5px 11px; border-radius: 999px;
    margin-bottom: 28px;
    letter-spacing: 0.01em;
  }

  /* Headline */
  .lp-headline {
    font-size: clamp(30px, 4vw, 50px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.035em;
    color: var(--lp-text);
    margin-bottom: 20px;
  }
  .lp-headline__accent { color: var(--lp-accent); }

  .lp-sub {
    font-size: 16px; color: var(--lp-text-muted);
    line-height: 1.7; max-width: 420px; margin-bottom: 32px;
  }

  .lp-cta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

  .lp-trust {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-top: 20px;
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--lp-text-subtle);
  }
  .lp-trust-dot {
    display: inline-block; width: 3px; height: 3px;
    border-radius: 50%; background: var(--lp-text-subtle);
  }

  /* ── Preview window ── */
  .lp-preview {
    border: 1px solid var(--lp-border);
    border-radius: 12px;
    background: var(--lp-bg-subtle);
    overflow: hidden;
    box-shadow:
      0 0 0 1px rgba(99,102,241,0.04),
      0 4px 8px rgba(0,0,0,0.04),
      0 16px 40px rgba(0,0,0,0.07);
  }
  [data-theme="dark"] .lp-preview {
    box-shadow:
      0 0 0 1px rgba(129,140,248,0.08),
      0 4px 16px rgba(0,0,0,0.4),
      0 24px 56px rgba(0,0,0,0.5);
  }
  .lp-preview__bar {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 16px;
    background: var(--lp-bg);
    border-bottom: 1px solid var(--lp-border);
  }
  .lp-preview__dots { display: flex; gap: 5px; }
  .lp-preview__dots span {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--lp-border-strong);
  }
  .lp-preview__url {
    flex: 1; font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--lp-text-subtle);
    background: var(--lp-bg-subtle);
    border: 1px solid var(--lp-border);
    border-radius: 5px; padding: 3px 10px; margin: 0 6px;
  }
  .lp-preview__body { padding: 14px 16px; }
  .lp-preview__filter-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px; flex-wrap: wrap; gap: 6px;
  }
  .lp-preview__count {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-text-subtle);
  }
  .lp-preview__badges { display: flex; gap: 5px; }

  /* ── Issue rows ── */
  .lp-issue {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
    padding: 12px 14px;
    border: 1px solid var(--lp-border); border-bottom: none;
    background: var(--lp-bg);
    transition: background 100ms;
    cursor: pointer;
  }
  .lp-issue--first { border-radius: 8px 8px 0 0; }
  .lp-issue--last { border-bottom: 1px solid var(--lp-border); border-radius: 0 0 8px 8px; }
  .lp-issue:hover { background: var(--lp-bg-subtle); }
  .lp-issue__left { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .lp-issue__repo {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-accent); font-weight: 500;
  }
  .lp-issue__title { font-size: 12px; font-weight: 500; color: var(--lp-text); line-height: 1.4; }
  .lp-issue__meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
  .lp-issue__age {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-text-subtle);
  }
  .lp-issue__num {
    font-family: var(--font-mono, monospace); font-size: 10px;
    color: var(--lp-text-subtle); flex-shrink: 0;
  }

  /* ── Badges ── */
  .lp-badge {
    display: inline-flex; align-items: center;
    font-family: var(--font-mono, monospace); font-size: 10px; font-weight: 500;
    padding: 2px 6px; border-radius: 4px; border: 1px solid; white-space: nowrap;
  }
  .lp-badge--lang {
    background: var(--lp-bg-subtle); color: var(--lp-text-muted);
    border-color: var(--lp-border);
  }
  .lp-badge--gfi {
    background: var(--lp-green-subtle); color: var(--lp-green);
    border-color: var(--lp-green-border);
  }
  .lp-badge--blue {
    background: var(--lp-blue-subtle); color: var(--lp-blue);
    border-color: var(--lp-blue-border);
  }
  .lp-badge--orange {
    background: var(--lp-orange-subtle); color: var(--lp-orange);
    border-color: var(--lp-orange-border);
  }
  .lp-badge--purple {
    background: #F3F0FB; color: #6D28D9; border-color: #DDD6FE;
  }
  [data-theme="dark"] .lp-badge--purple {
    background: rgba(167,139,250,0.10); color: #A78BFA; border-color: rgba(167,139,250,0.22);
  }

  /* ── Sections ── */
  .lp-section { padding: 80px 0; border-bottom: 1px solid var(--lp-border); }
  .lp-section--tinted { background: var(--lp-bg-tinted); }

  .lp-section-header { margin-bottom: 48px; }
  .lp-label {
    font-family: var(--font-mono, monospace); font-size: 11px;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--lp-accent); margin-bottom: 12px;
  }
  .lp-section-heading {
    font-size: clamp(22px, 2.8vw, 34px);
    font-weight: 700; letter-spacing: -0.025em; line-height: 1.2;
    color: var(--lp-text);
  }

  /* ── Steps (3 cards) ── */
  .lp-steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .lp-step {
    background: var(--lp-bg);
    border: 1px solid var(--lp-border);
    border-radius: 10px;
    padding: 28px 24px;
  }
  .lp-step__num {
    display: block;
    font-family: var(--font-mono, monospace); font-size: 11px; font-weight: 600;
    color: var(--lp-accent); letter-spacing: 0.05em; margin-bottom: 18px;
  }
  .lp-step__title {
    font-size: 16px; font-weight: 600; color: var(--lp-text);
    margin-bottom: 10px; line-height: 1.3;
  }
  .lp-step__body {
    font-size: 14px; color: var(--lp-text-muted); line-height: 1.7;
  }

  /* ── Features (2×2) ── */
  .lp-features {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px 48px;
  }
  .lp-feature { display: flex; gap: 14px; align-items: flex-start; }
  .lp-feature__icon { color: var(--lp-accent); flex-shrink: 0; margin-top: 1px; }
  .lp-feature__title {
    font-size: 15px; font-weight: 600; color: var(--lp-text);
    margin-bottom: 7px; line-height: 1.3;
  }
  .lp-feature__body {
    font-size: 14px; color: var(--lp-text-muted); line-height: 1.7;
  }

  /* ── FAQ ── */
  .lp-faq { border-top: 1px solid var(--lp-border); }
  .lp-faq__item { border-bottom: 1px solid var(--lp-border); }
  .lp-faq__q {
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    padding: 20px 0; font-size: 15px; font-weight: 500;
    cursor: pointer; list-style: none; color: var(--lp-text);
  }
  .lp-faq__q::-webkit-details-marker { display: none; }
  .lp-chevron {
    flex-shrink: 0; color: var(--lp-text-subtle);
    transition: transform 200ms cubic-bezier(0.16,1,0.3,1);
  }
  details[open] .lp-chevron { transform: rotate(180deg); }
  .lp-faq__a {
    padding-bottom: 20px; font-size: 14px; color: var(--lp-text-muted);
    line-height: 1.7; max-width: 680px;
  }
  .lp-code {
    font-family: var(--font-mono, monospace); font-size: 12px;
    background: var(--lp-accent-subtle); border: 1px solid var(--lp-accent-muted);
    border-radius: 4px; padding: 1px 5px; color: var(--lp-accent);
  }

  /* ── CTA strip ── */
  .lp-cta-strip {
    padding: 72px 0;
    background: var(--lp-accent);
    position: relative; overflow: hidden;
  }
  .lp-cta-strip::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 80% at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%);
    pointer-events: none;
  }
  [data-theme="dark"] .lp-cta-strip {
    background: var(--lp-bg-tinted);
    border-top: 1px solid var(--lp-border);
  }
  [data-theme="dark"] .lp-cta-strip::before { display: none; }
  .lp-cta-strip__inner {
    display: flex; align-items: center; justify-content: space-between;
    gap: 32px; flex-wrap: wrap; position: relative; z-index: 1;
  }
  .lp-cta-strip__heading {
    font-size: clamp(22px, 3vw, 30px); font-weight: 700;
    letter-spacing: -0.025em; color: #fff; margin-bottom: 8px;
  }
  [data-theme="dark"] .lp-cta-strip__heading { color: var(--lp-text); }
  .lp-cta-strip__sub { font-size: 15px; color: rgba(255,255,255,0.72); }
  [data-theme="dark"] .lp-cta-strip__sub { color: var(--lp-text-muted); }
  [data-theme="dark"] .lp-btn--cta-strip {
    background: var(--lp-accent); color: #fff; border-color: var(--lp-accent);
  }
  [data-theme="dark"] .lp-btn--cta-strip:hover {
    background: var(--lp-accent-hover); border-color: var(--lp-accent-hover);
  }

  /* ── Footer ── */
  .lp-footer { padding: 32px 0; }
  .lp-footer__inner {
    display: flex; align-items: center; justify-content: space-between;
    border-top: 1px solid var(--lp-border); padding-top: 32px;
    flex-wrap: wrap; gap: 16px;
  }
  .lp-footer__copy {
    font-family: var(--font-mono, monospace); font-size: 12px;
    color: var(--lp-text-subtle);
  }
  .lp-footer__links { display: flex; gap: 20px; }
  .lp-footer__link {
    font-family: var(--font-mono, monospace); font-size: 12px;
    color: var(--lp-text-subtle); transition: color 120ms;
  }
  .lp-footer__link:hover { color: var(--lp-text); }

  /* ── Responsive ── */
  @media (max-width: 1023px) {
    .lp-hero__grid { grid-template-columns: 1fr; gap: 40px; }
    .lp-hero::after { display: none; }
  }

  @media (max-width: 767px) {
    .lp-steps { grid-template-columns: 1fr; gap: 14px; }
    .lp-features { grid-template-columns: 1fr; gap: 22px; }
    .lp-cta-strip__inner { flex-direction: column; align-items: flex-start; }
    .lp-headline { font-size: 30px; }
    .lp-section { padding: 56px 0; }
  }

  @media (max-width: 480px) {
    .lp-hero { padding: 56px 0 48px; }
    .lp-footer__inner { flex-direction: column; text-align: center; }
    .lp-footer__links { justify-content: center; }
    .lp-preview__filter-row { flex-direction: column; align-items: flex-start; }
  }
`
