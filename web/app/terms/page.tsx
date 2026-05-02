import type { Metadata } from 'next'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Terms of Service — Contrib.to',
  description: 'Terms governing the use of Contrib.to.',
}

export default function TermsPage() {
  return (
    <div className="hcl">
      <style>{css}</style>

      <nav className="hcl-nav">
        <div className="hcl-nav__inner">
          <a href="/">
            <Logo className="hcl-logo" iconSize={18} />
          </a>
          <a href="/" className="hcl-back">← Back</a>
        </div>
      </nav>

      <main className="hcl-legal">
        <div className="hcl-container">
          <p className="hcl-eyebrow">// legal</p>
          <h1 className="hcl-headline">Terms of Service</h1>
          <p className="hcl-meta">Last updated: May 2, 2026</p>

          <div className="hcl-prose">
            <p>
              By using contrib.to you agree to these terms. They&apos;re short — please read them.
            </p>

            <h2>1. The service</h2>
            <p>
              Contrib.to is a free tool that surfaces good first issues from GitHub repositories
              you have starred. It is provided as-is, with no guarantees of uptime, data accuracy,
              or continued availability.
            </p>

            <h2>2. GitHub Terms of Service</h2>
            <p>
              You must comply with{' '}
              <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" className="hcl-link">
                GitHub&apos;s Terms of Service
              </a>{' '}
              when using this service. We access the GitHub API on your behalf using the OAuth token
              you grant us. You are responsible for the GitHub account you authenticate with.
            </p>

            <h2>3. Acceptable use</h2>
            <ul>
              <li>Do not attempt to scrape, abuse, or overload the service or the GitHub API through it.</li>
              <li>Do not use the service in any way that violates GitHub&apos;s Terms of Service.</li>
              <li>One account per person.</li>
              <li>Do not attempt to access another user&apos;s data.</li>
            </ul>

            <h2>4. No warranty</h2>
            <p>
              The service is provided &ldquo;as is&rdquo; without warranties of any kind, express or implied.
              We do not guarantee that the service will be error-free, uninterrupted, or that issue data
              will be complete or up to date.
            </p>

            <h2>5. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, contrib.to and its operator shall not be liable
              for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>

            <h2>6. Account termination</h2>
            <p>
              You may delete your account at any time from the dashboard settings. We reserve the right
              to terminate accounts that abuse the service, without prior notice.
            </p>

            <h2>7. Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the service after changes
              are posted constitutes acceptance of the updated terms. The date at the top of this page
              will always reflect the latest revision.
            </p>
          </div>
        </div>
      </main>

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

const css = `
  .hcl {
    background: var(--hc-bg);
    color: var(--hc-text);
    font-family: var(--font-sans, 'IBM Plex Sans', system-ui, sans-serif);
    min-height: 100vh;
  }
  .hcl-container { max-width: 720px; margin: 0 auto; padding: 0 24px; }
  .hcl-nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--hc-bg-overlay);
    border-bottom: 1px solid var(--hc-border);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .hcl-nav__inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 52px; max-width: 720px; margin: 0 auto; padding: 0 24px;
  }
  .hcl-logo {
    font-family: var(--font-mono, monospace);
    font-size: 13px; font-weight: 500; letter-spacing: -0.01em;
  }
  .hcl-back {
    font-family: var(--font-mono, monospace); font-size: 12px;
    color: var(--hc-text-muted); text-decoration: none;
    transition: color 120ms;
  }
  .hcl-back:hover { color: var(--hc-text); }

  .hcl-legal { padding: 64px 0 80px; }
  .hcl-eyebrow {
    font-family: var(--font-mono, monospace); font-size: 11px;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--hc-text-subtle); margin-bottom: 16px;
  }
  .hcl-headline {
    font-size: 36px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.1;
    color: var(--hc-text); margin-bottom: 8px;
  }
  .hcl-meta {
    font-family: var(--font-mono, monospace); font-size: 11px;
    color: var(--hc-text-subtle); margin-bottom: 48px;
  }

  .hcl-prose { font-size: 15px; line-height: 1.75; color: var(--hc-text-muted); }
  .hcl-prose p { margin-bottom: 16px; }
  .hcl-prose h2 {
    font-size: 17px; font-weight: 600; color: var(--hc-text);
    letter-spacing: -0.02em; margin-top: 40px; margin-bottom: 12px;
  }
  .hcl-prose ul { padding-left: 20px; margin-bottom: 16px; }
  .hcl-prose li { margin-bottom: 6px; }
  .hcl-prose strong { color: var(--hc-text); font-weight: 500; }
  .hcl-link { color: var(--hc-accent); text-decoration: underline; text-underline-offset: 2px; }
  .hcl-link:hover { color: var(--hc-accent-hover); }

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

  @media (max-width: 600px) {
    .hcl-footer__inner { flex-direction: column; gap: 16px; text-align: center; }
  }
`
