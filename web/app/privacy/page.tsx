import type { Metadata } from 'next'
import { Logo } from '@/components/logo'

export const metadata: Metadata = {
  title: 'Privacy Policy — Contrib.to',
  description: 'How Contrib.to handles your data.',
}

export default function PrivacyPage() {
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
          <h1 className="hcl-headline">Privacy Policy</h1>
          <p className="hcl-meta">Last updated: May 2, 2026</p>

          <div className="hcl-prose">
            <p>
              Contrib.to is a small, independent tool. This policy explains exactly what data we collect,
              why, and how. No legalese.
            </p>

            <h2>What we collect</h2>
            <table className="hcl-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Source</th>
                  <th>Why</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>GitHub user ID &amp; username</td>
                  <td>GitHub OAuth</td>
                  <td>Identify your account</td>
                </tr>
                <tr>
                  <td>Starred repositories list</td>
                  <td>GitHub API</td>
                  <td>Find relevant issues for you</td>
                </tr>
                <tr>
                  <td>Issue metadata (title, URL, labels, status)</td>
                  <td>GitHub API</td>
                  <td>Serve your dashboard without hammering the GitHub API</td>
                </tr>
                <tr>
                  <td>GitHub access token</td>
                  <td>GitHub OAuth</td>
                  <td>Make API calls on your behalf — encrypted with AES-256-GCM at rest</td>
                </tr>
              </tbody>
            </table>

            <h2>What we do NOT collect</h2>
            <ul>
              <li>Your email address</li>
              <li>Your private repositories or any private code</li>
              <li>Issue body content or comments</li>
              <li>Your followers, following, or activity on GitHub</li>
              <li>Any payment information (the service is free)</li>
            </ul>

            <h2>How data is stored</h2>
            <p>
              All data is stored in a SQLite database on a Hetzner VPS located in Germany. The database
              is continuously backed up (encrypted) to Cloudflare R2 object storage with a 7-day
              retention window.
            </p>
            <p>
              Your GitHub access token is encrypted with AES-256-GCM before being written to disk.
              It is never logged.
            </p>

            <h2>Cookies and local storage</h2>
            <p>We use two types of client-side storage:</p>
            <ul>
              <li>
                <strong>Session cookie</strong> (<code>session</code>) — stores your authenticated
                session for 7 days. It is <code>HttpOnly</code>, <code>Secure</code>, and
                <code>SameSite=Lax</code>. Not accessible to JavaScript.
              </li>
              <li>
                <strong>localStorage</strong> (<code>ct-theme</code>) — stores your light/dark
                preference. Never sent to the server.
              </li>
            </ul>
            <p>We do not use any tracking cookies or third-party analytics.</p>

            <h2>Third parties</h2>
            <table className="hcl-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Purpose</th>
                  <th>What they receive</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>GitHub</td>
                  <td>OAuth + API</td>
                  <td>Your OAuth authorization, API requests made with your token</td>
                </tr>
                <tr>
                  <td>Vercel</td>
                  <td>Frontend hosting</td>
                  <td>HTTP requests to the Next.js frontend</td>
                </tr>
                <tr>
                  <td>Hetzner</td>
                  <td>Backend hosting</td>
                  <td>HTTP requests to the Go API, database stored on disk</td>
                </tr>
                <tr>
                  <td>Cloudflare R2</td>
                  <td>Database backup</td>
                  <td>Encrypted database replicas</td>
                </tr>
              </tbody>
            </table>
            <p>We do not sell, rent, or share your data with any other third parties.</p>

            <h2>Data retention</h2>
            <p>
              Your user record, GitHub token, and repository associations are kept until you delete
              your account. Repository and issue data may remain in the database after account deletion,
              as it is shared across users and originates from public GitHub data. Backups are retained
              for 7 days.
            </p>

            <h2>Your rights</h2>
            <ul>
              <li>
                <strong>Delete your account</strong> — available in the dashboard under Settings.
                This immediately removes your user record, encrypted token, and all starred repo links.
              </li>
              <li>
                <strong>Revoke access</strong> — you can revoke the OAuth token at any time from{' '}
                <a href="https://github.com/settings/applications" className="hcl-link">
                  github.com/settings/applications
                </a>.
              </li>
            </ul>

            <h2>Changes</h2>
            <p>
              If we make material changes to this policy, we will update the date at the top of this
              page. Continued use of the service constitutes acceptance of the updated policy.
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
  .hcl-prose code {
    font-family: var(--font-mono, monospace); font-size: 12px;
    background: var(--hc-bg-subtle); border: 1px solid var(--hc-border);
    border-radius: 3px; padding: 1px 5px; color: var(--hc-text-muted);
  }
  .hcl-link { color: var(--hc-accent); text-decoration: underline; text-underline-offset: 2px; }
  .hcl-link:hover { color: var(--hc-accent-hover); }

  .hcl-table {
    width: 100%; border-collapse: collapse; font-size: 13px;
    margin-bottom: 24px;
  }
  .hcl-table th {
    text-align: left; font-weight: 500; color: var(--hc-text);
    font-family: var(--font-mono, monospace); font-size: 11px; letter-spacing: 0.04em;
    padding: 8px 12px; border-bottom: 1px solid var(--hc-border);
    background: var(--hc-bg-subtle);
  }
  .hcl-table td {
    padding: 10px 12px; border-bottom: 1px solid var(--hc-border-subtle);
    vertical-align: top; color: var(--hc-text-muted);
  }
  .hcl-table tr:last-child td { border-bottom: none; }
  .hcl-table { border: 1px solid var(--hc-border); border-radius: 8px; overflow: hidden; }

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
    .hcl-table { font-size: 12px; }
    .hcl-table th, .hcl-table td { padding: 8px; }
  }
`
