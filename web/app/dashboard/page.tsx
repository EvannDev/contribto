'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface Issue {
  id: number
  number: number
  title: string
  url: string
  repo: { full_name: string; language: string; stars: number }
  labels: string[]
  created_at: string | null
  updated_at: string | null
}
interface Repo { name: string; lang: string; issues: number; stars: string }

const LABEL_COLORS: Record<string, { bg: string; fg: string }> = {
  'good first issue': { bg: '#D1FAE5', fg: '#065F46' },
  'bug':              { bg: '#FEE2E2', fg: '#991B1B' },
  'help wanted':      { bg: '#FEF3C7', fg: '#92400E' },
  'enhancement':      { bg: '#EDE9FE', fg: '#5B21B6' },
  'feature':          { bg: '#EDE9FE', fg: '#5B21B6' },
  'documentation':    { bg: '#DBEAFE', fg: '#1E40AF' },
}
const DEFAULT_LABEL_COLOR = { bg: '#F3F4F6', fg: '#374151' }

function labelColor(text: string) {
  return LABEL_COLORS[text.toLowerCase()] ?? DEFAULT_LABEL_COLOR
}

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

type Tab = 'issues' | 'repos' | 'settings'

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('issues')
  const [issues, setIssues] = useState<Issue[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [login, setLogin] = useState('')
  const [langFilter, setLangFilter] = useState('All')
  const [repoFilter, setRepoFilter] = useState('All')
  const [sortBy, setSortBy] = useState('created_desc')
  const [search, setSearch] = useState('')
  const [dark, setDark] = useState(false)
  const [notif, setNotif] = useState(true)
  const [rescanning, setRescanning] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  function fetchIssues() {
    setLoading(true)
    fetch(`${apiUrl}/issues?limit=100`, { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) { router.push('/login'); return }
        if (!res.ok) throw new Error(`fetch issues: ${res.status}`)
        const data = await res.json() as { issues: Issue[]; total: number }
        setIssues(data.issues ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchIssues()
    fetch(`${apiUrl}/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() as Promise<{ login: string }> : null)
      .then(data => { if (data) setLogin(data.login) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('ct-theme', next ? 'dark' : 'light')
  }

  const languages = ['All', ...Array.from(new Set(issues.map(i => i.repo.language).filter(Boolean))).sort()]
  const repos = ['All', ...Array.from(new Set(issues.map(i => i.repo.full_name))).sort()]

  const filtered = useMemo(() => {
    let list = [...issues]
    if (langFilter !== 'All') list = list.filter(i => i.repo.language === langFilter)
    if (repoFilter !== 'All') list = list.filter(i => i.repo.full_name === repoFilter)
    if (search) list = list.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) || i.repo.full_name.includes(search)
    )
    if (sortBy === 'oldest') list = [...list].reverse()
    if (sortBy === 'created_desc') list = [...list].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    if (sortBy === 'created_asc') list = [...list].sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    return list
  }, [issues, langFilter, repoFilter, search, sortBy])

  return (
    <>
      <style>{css}</style>
      <div className="dash-layout">
        {/* Header */}
        <header className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div className="header-logo">Contrib<span className="accent">.to</span></div>
            {([['issues', 'Issues'], ['repos', 'Starred repos'], ['settings', 'Settings']] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`header-tab${activeTab === id ? ' header-tab--active' : ''}`}
              >
                <TabIcon id={id} />
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="icon-btn" onClick={toggleDark} title="Toggle dark mode">
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <div className="avatar">{login ? login[0].toUpperCase() : '?'}</div>
            <button className="ghost-btn" onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/')
            }}>Sign out</button>
          </div>
        </header>

        {/* Body */}
        <div className="dash-body">
          {activeTab === 'issues' && (
            <>
              {/* Filter sidebar */}
              <aside className="dash-sidebar">
                <FilterSection title="Language">
                  {languages.map(l => (
                    <FilterOption key={l} label={l} active={langFilter === l} onClick={() => setLangFilter(l)} />
                  ))}
                </FilterSection>
                <FilterSection title="Sort by">
                  {[['created_desc', 'Created: newest'], ['created_asc', 'Created: oldest'], ['newest', 'Updated: newest'], ['oldest', 'Updated: oldest']].map(([v, l]) => (
                    <FilterOption key={v} label={l} active={sortBy === v} onClick={() => setSortBy(v)} />
                  ))}
                </FilterSection>
                <FilterSection title="Repository">
                  {repos.map(r => (
                    <FilterOption key={r} label={r === 'All' ? r : r.split('/')[1]} active={repoFilter === r} onClick={() => setRepoFilter(r)} mono={r !== 'All'} />
                  ))}
                </FilterSection>
              </aside>

              {/* Main feed */}
              <main className="dash-main">
                <div className="search-row">
                  <div style={{ flex: 1, position: 'relative' }}>
                    <SearchIcon />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search issues…"
                      className="search-input"
                    />
                  </div>
                  <span className="issue-count">{filtered.length} of {total} issues</span>
                </div>
                {loading ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                  <EmptyState onReset={() => { setSearch(''); setLangFilter('All'); setRepoFilter('All') }} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filtered.map(issue => <IssueRow key={issue.id} issue={issue} />)}
                  </div>
                )}
              </main>
            </>
          )}

          {activeTab === 'repos' && <ReposList issues={issues} />}
          {activeTab === 'settings' && <SettingsPanel notif={notif} setNotif={setNotif} login={login} rescanning={rescanning} onRescan={async () => {
            setRescanning(true)
            await fetch(`${apiUrl}/sync-stars`, { method: 'POST', credentials: 'include' }).catch(() => {})
            fetchIssues()
            setRescanning(false)
          }} onDisconnect={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/')
          }} />}
        </div>
      </div>
    </>
  )
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="filter-section-title">{title}</div>
      {children}
    </div>
  )
}

function FilterOption({ label, active, onClick, mono }: { label: string; active: boolean; onClick: () => void; mono?: boolean }) {
  return (
    <button onClick={onClick} className={`filter-option${active ? ' filter-option--active' : ''}`} style={{ fontFamily: mono ? 'var(--font-mono, monospace)' : 'inherit' }}>
      {label}
    </button>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={issue.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="issue-row"
      style={{
        display: 'block', textDecoration: 'none',
        background: hovered ? 'var(--bg-hover)' : 'var(--bg-surface)',
        borderColor: hovered ? 'var(--border-strong)' : 'var(--border-default)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <IssueCircleIcon />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--fg-default)', marginBottom: 5, lineHeight: 1.35 }}>{issue.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--fg-muted)' }}>{issue.repo.full_name}</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--fg-subtle)' }}>#{issue.number}</span>
            {issue.labels.map(l => {
              const { bg, fg } = labelColor(l)
              return <span key={l} style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color: fg, whiteSpace: 'nowrap' }}>{l}</span>
            })}
            {issue.repo.language && (
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', padding: '0 6px', borderRadius: 999, color: 'var(--fg-muted)' }}>{issue.repo.language}</span>
            )}
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>{relativeTime(issue.updated_at)}</span>
        </div>
      </div>
    </a>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px' }}>
      <div style={{ color: 'var(--fg-subtle)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
          <rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="8" x2="16" y1="10" y2="10" /><line x1="8" x2="12" y1="14" y2="14" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 6 }}>No issues match these filters</div>
      <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 16 }}>Try clearing your search or adjusting the language filter.</div>
      <button onClick={onReset} className="secondary-btn">Clear filters</button>
    </div>
  )
}

function ReposList({ issues }: { issues: Issue[] }) {
  const [hov, setHov] = useState<string | null>(null)

  const repos = useMemo(() => {
    const map = new Map<string, { name: string; lang: string; stars: number; issueCount: number }>()
    for (const issue of issues) {
      const key = issue.repo.full_name
      const existing = map.get(key)
      if (existing) {
        existing.issueCount++
      } else {
        map.set(key, { name: key, lang: issue.repo.language, stars: issue.repo.stars, issueCount: 1 })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.issueCount - a.issueCount)
  }, [issues])

  function formatStars(n: number) {
    if (n >= 1000) return `${Math.round(n / 100) / 10}k`
    return String(n)
  }

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxWidth: 720 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 4 }}>Starred repositories</div>
      <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginBottom: 20 }}>{repos.length} repos with open issues</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {repos.map(repo => {
          const initial = repo.name.split('/')[1][0].toUpperCase()
          const isHov = hov === repo.name
          return (
            <div
              key={repo.name}
              onMouseEnter={() => setHov(repo.name)}
              onMouseLeave={() => setHov(null)}
              className="repo-row"
              style={{ background: isHov ? 'var(--bg-hover)' : 'var(--bg-surface)', borderColor: isHov ? 'var(--border-strong)' : 'var(--border-default)' }}
            >
              <div className="repo-initial">{initial}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 13, fontWeight: 500, color: 'var(--fg-default)' }}>{repo.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {repo.lang && <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', padding: '0 6px', borderRadius: 999, color: 'var(--fg-muted)' }}>{repo.lang}</span>}
                <span style={{ fontSize: 12, color: 'var(--fg-subtle)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <StarIcon size={11} /> {formatStars(repo.stars)}
                </span>
                <span style={{ fontSize: 11, fontWeight: 500, background: 'var(--accent-subtle)', color: 'var(--accent-fg)', border: '1px solid var(--accent-muted)', padding: '1px 8px', borderRadius: 999 }}>{repo.issueCount} {repo.issueCount === 1 ? 'issue' : 'issues'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

function SettingsPanel({ notif, setNotif, login, rescanning, onRescan, onDisconnect }: {
  notif: boolean
  setNotif: (v: boolean) => void
  login: string
  rescanning: boolean
  onRescan: () => void
  onDisconnect: () => void
}) {
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', maxWidth: 560 }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 20 }}>Settings</div>

      <SettingsSection title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-default)' }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{login ? login[0].toUpperCase() : '?'}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-default)' }}>{login || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Signed in via GitHub OAuth</div>
          </div>
        </div>
        <div style={{ padding: '16px 0' }}>
          <button onClick={onDisconnect} style={{ display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 12px', fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: 'pointer', color: '#B91C1C', background: '#FEF2F2', border: '1px solid rgba(185,28,28,0.2)', fontFamily: 'inherit' }}>
            Disconnect account
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-default)' }}>Email notifications</div>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Get an email when new issues are found</div>
          </div>
          <Toggle value={notif} onChange={setNotif} />
        </div>
      </SettingsSection>

      <SettingsSection title="Data">
        <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          We store your GitHub username and the list of your public starred repositories. Nothing else. To delete your data, disconnect your account above.
        </div>
        <button className="secondary-btn" onClick={onRescan} disabled={rescanning}>
          {rescanning ? 'Scanning…' : 'Re-scan repositories'}
        </button>
      </SettingsSection>
    </main>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-default)' }}>{title}</div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 36, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer', background: value ? 'var(--accent)' : 'var(--border-strong)', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: value ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 200ms', display: 'block' }} />
    </button>
  )
}

function TabIcon({ id }: { id: Tab }) {
  if (id === 'issues') return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="1" /></svg>
  if (id === 'repos') return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
}

function IssueCircleIcon() {
  return <svg style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="1" /></svg>
}


function StarIcon({ size = 14 }: { size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
}

function SearchIcon() {
  return (
    <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-subtle)' }} xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function SunIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
}

function MoonIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
}

const css = `
  html, body { height: 100%; overflow: hidden; }
  .dash-layout { display: flex; flex-direction: column; height: 100vh; background: var(--bg-base); }

  .dash-header {
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-surface); padding: 0 20px;
    display: flex; align-items: center; justify-content: space-between;
    height: 48px; flex-shrink: 0;
  }
  .header-logo { font-weight: 600; font-size: 15px; letter-spacing: -0.01em; margin-right: 24px; }
  .accent { color: var(--accent-fg); }
  .header-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 0 12px; height: 48px; border: none; background: none;
    font-size: 13px; font-weight: 500; font-family: inherit; cursor: pointer;
    color: var(--fg-muted); border-bottom: 2px solid transparent;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }
  .header-tab:hover { color: var(--fg-default); }
  .header-tab--active { color: var(--fg-default); border-bottom-color: var(--accent); }
  .avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--bg-surface-2); border: 1px solid var(--border-default);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: var(--fg-muted);
    font-family: var(--font-mono, monospace); flex-shrink: 0;
  }
  .icon-btn {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    background: transparent; color: var(--fg-muted); cursor: pointer;
  }
  .icon-btn:hover { background: var(--bg-hover); color: var(--fg-default); }
  .ghost-btn {
    font-size: 12px; color: var(--fg-subtle); background: none; border: none;
    cursor: pointer; font-family: inherit; text-decoration: none; padding: 4px 6px;
    border-radius: var(--radius-sm);
  }
  .ghost-btn:hover { color: var(--fg-muted); background: var(--bg-hover); }

  .dash-body { flex: 1; overflow: hidden; display: flex; }

  .dash-sidebar {
    width: 220px; flex-shrink: 0; border-right: 1px solid var(--border-default);
    background: var(--bg-surface); padding: 20px 16px; overflow-y: auto;
  }
  .filter-section-title {
    font-size: 11px; font-weight: 500; color: var(--fg-subtle);
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px;
  }
  .filter-option {
    display: block; width: 100%; text-align: left; padding: 4px 8px;
    border: none; border-radius: 5px; cursor: pointer; font-size: 13px;
    font-family: inherit; margin-bottom: 1px; transition: background var(--transition-fast);
    background: transparent; color: var(--fg-muted);
  }
  .filter-option:hover { background: var(--bg-hover); color: var(--fg-default); }
  .filter-option--active { background: var(--accent-subtle); color: var(--accent-fg); font-weight: 500; }
  .checkbox-label {
    display: flex; align-items: center; gap: 7px; font-size: 13px;
    color: var(--fg-default); cursor: pointer; padding: 3px 0;
  }

  .dash-main { flex: 1; overflow-y: auto; padding: 20px 24px; }
  .search-row {
    display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
  }
  .search-input {
    width: 100%; height: 32px; padding-left: 32px; padding-right: 10px;
    border: 1px solid var(--border-strong); border-radius: 6px; font-size: 13px;
    font-family: inherit; background: var(--bg-surface); color: var(--fg-default); outline: none;
    transition: border-color var(--transition-fast);
  }
  .search-input:focus { border-color: var(--border-focus); }
  .issue-count { font-size: 13px; color: var(--fg-subtle); white-space: nowrap; }
  .issue-row {
    border: 1px solid; border-radius: 6px; padding: 12px 14px; cursor: pointer;
    transition: background var(--transition-base), border-color var(--transition-base);
    margin-bottom: 0;
  }

  .repo-row {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 6px; cursor: pointer;
    border: 1px solid; transition: background var(--transition-base), border-color var(--transition-base);
  }
  .repo-initial {
    width: 30px; height: 30px; border-radius: 6px;
    background: var(--bg-surface-2); border: 1px solid var(--border-default);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 600; color: var(--fg-muted);
    font-family: var(--font-mono, monospace); flex-shrink: 0;
  }
  .secondary-btn {
    display: inline-flex; align-items: center; height: 28px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 6px; cursor: pointer;
    background: var(--bg-surface); color: var(--fg-default);
    border: 1px solid var(--border-strong); font-family: inherit;
    transition: background var(--transition-fast);
  }
  .secondary-btn:hover { background: var(--bg-hover); }
`
