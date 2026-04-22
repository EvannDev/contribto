'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Issue {
  id: number
  number: number
  title: string
  url: string
  repo: { full_name: string; language: string; stars: number; last_scanned_at: string | null }
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
  const [sortBy, setSortBy] = useState('updated_desc')
  const [search, setSearch] = useState('')
  const [dark, setDark] = useState(false)
  const [notif, setNotif] = useState(true)
  const [rescanning, setRescanning] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [avatarErr, setAvatarErr] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  )

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  function fetchIssues(sort: string) {
    setLoading(true)
    fetch(`${apiUrl}/issues?limit=100&sort=${sort}`, { credentials: 'include' })
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
    fetchIssues(sortBy)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy])

  useEffect(() => {
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
    return list
  }, [issues, langFilter, repoFilter, search])

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
            {login && !avatarErr
              ? <Image src={`https://github.com/${login}.png?size=64`} alt={login} width={28} height={28} className="avatar avatar--photo" onError={() => setAvatarErr(true)} />
              : <div className="avatar">{login ? login[0].toUpperCase() : '?'}</div>
            }
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
              {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
              {/* Filter sidebar */}
              <aside className={`dash-sidebar${sidebarOpen ? '' : ' dash-sidebar--hidden'}`}>
                <FilterSection title="Language">
                  {languages.map(l => (
                    <FilterOption key={l} label={l} active={langFilter === l} onClick={() => setLangFilter(l)} />
                  ))}
                </FilterSection>
                <FilterSection title="Sort by">
                  {[['updated_desc', 'Updated: newest'], ['updated_asc', 'Updated: oldest'], ['created_desc', 'Created: newest'], ['created_asc', 'Created: oldest']].map(([v, l]) => (
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
                  <button className="icon-btn" onClick={() => setSidebarOpen(v => !v)} title="Toggle filters">
                    <FilterIcon />
                  </button>
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
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className={`view-toggle${viewMode === 'list' ? ' view-toggle--active' : ''}`} onClick={() => setViewMode('list')} title="List view"><ListViewIcon /></button>
                    <button className={`view-toggle${viewMode === 'grid' ? ' view-toggle--active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view"><GridViewIcon /></button>
                  </div>
                </div>
                {loading ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: 'var(--fg-subtle)' }}>Loading…</div>
                ) : filtered.length === 0 ? (
                  <EmptyState onReset={() => { setSearch(''); setLangFilter('All'); setRepoFilter('All') }} />
                ) : viewMode === 'list' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {filtered.map(issue => <IssueRow key={issue.id} issue={issue} />)}
                  </div>
                ) : (
                  <div className="issues-grid">
                    {filtered.map(issue => <IssueCard key={issue.id} issue={issue} />)}
                  </div>
                )}
              </main>
            </>
          )}

          {activeTab === 'repos' && <ReposList issues={issues} />}
          {activeTab === 'settings' && <SettingsPanel notif={notif} setNotif={setNotif} login={login} rescanning={rescanning} onRescan={async () => {
            setRescanning(true)
            await fetch(`${apiUrl}/sync-stars`, { method: 'POST', credentials: 'include' }).catch(() => {})
            fetchIssues(sortBy)
            setRescanning(false)
          }} onDisconnect={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            router.push('/')
          }} onDeleteAccount={async () => {
            await fetch(`${apiUrl}/me`, { method: 'DELETE', credentials: 'include' }).catch(() => {})
            await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
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
  const [imgErr, setImgErr] = useState(false)
  const owner = issue.repo.full_name.slice(0, issue.repo.full_name.indexOf('/'))
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
            {!imgErr && <Image src={`https://github.com/${owner}.png?size=32`} alt="" width={16} height={16} className="issue-owner-avatar" onError={() => setImgErr(true)} />}
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
          <span style={{ fontSize: 12, color: 'var(--fg-subtle)' }}>updated {relativeTime(issue.updated_at)}</span>
        </div>
      </div>
    </a>
  )
}

function IssueCard({ issue }: { issue: Issue }) {
  const [imgErr, setImgErr] = useState(false)
  const owner = issue.repo.full_name.slice(0, issue.repo.full_name.indexOf('/'))
  return (
    <a href={issue.url} target="_blank" rel="noopener noreferrer" className="issue-card">
      <div className="issue-card__header">
        <IssueCircleIcon />
        <span className="issue-card__title">{issue.title}</span>
      </div>
      <div className="issue-card__footer">
        <div className="issue-card__repo">
          {!imgErr && <Image src={`https://github.com/${owner}.png?size=32`} alt="" width={16} height={16} className="issue-owner-avatar" onError={() => setImgErr(true)} />}
          <span className="issue-card__repo-name">{issue.repo.full_name}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--fg-subtle)', flexShrink: 0 }}>updated {relativeTime(issue.updated_at)}</span>
      </div>
      {(issue.labels.length > 0 || issue.repo.language) && (
        <div className="issue-card__labels">
          {issue.labels.map(l => {
            const { bg, fg } = labelColor(l)
            return <span key={l} style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color: fg, whiteSpace: 'nowrap' }}>{l}</span>
          })}
          {issue.repo.language && (
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', padding: '0 6px', borderRadius: 999, color: 'var(--fg-muted)' }}>{issue.repo.language}</span>
          )}
        </div>
      )}
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

function formatStars(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

type RepoItem = { name: string; lang: string; stars: number; issueCount: number; lastScannedAt: string | null }

function RepoCard({ repo }: { repo: RepoItem }) {
  const slash = repo.name.indexOf('/')
  const owner = repo.name.slice(0, slash)
  const name  = repo.name.slice(slash + 1)
  const [imgErr, setImgErr] = useState(false)

  return (
    <a
      href={`https://github.com/${repo.name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="repo-card"
    >
      <div className="repo-card__top">
        <div className="repo-card__avatar">
          {!imgErr
            ? <Image
                src={`https://github.com/${owner}.png?size=64`}
                alt={owner}
                width={32}
                height={32}
                className="repo-card__avatar-img"
                onError={() => setImgErr(true)}
              />
            : <span className="repo-card__avatar-letter">{name[0].toUpperCase()}</span>
          }
        </div>
        <div className="repo-card__meta">
          <span className="repo-card__owner">{owner}</span>
          <span className="repo-card__name">{name}</span>
        </div>
      </div>
      <div className="repo-card__bottom">
        <div className="repo-card__chips">
          {repo.lang && <span className="repo-card__chip">{repo.lang}</span>}
          <span className="repo-card__stars-chip">
            <StarIcon size={10} />{formatStars(repo.stars)}
          </span>
        </div>
        <span className="repo-card__badge">
          {repo.issueCount} {repo.issueCount === 1 ? 'issue' : 'issues'}
        </span>
      </div>
      {repo.lastScannedAt && (
        <span style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>scanned {relativeTime(repo.lastScannedAt)}</span>
      )}
    </a>
  )
}

function ReposList({ issues }: { issues: Issue[] }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'issues' | 'stars' | 'name'>('issues')

  const repos = useMemo(() => {
    const map = new Map<string, RepoItem>()
    for (const issue of issues) {
      const key = issue.repo.full_name
      const existing = map.get(key)
      if (existing) {
        existing.issueCount++
      } else {
        map.set(key, { name: key, lang: issue.repo.language, stars: issue.repo.stars, issueCount: 1, lastScannedAt: issue.repo.last_scanned_at })
      }
    }
    let list = Array.from(map.values())
    if (search) list = list.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    if (sortBy === 'stars') return list.sort((a, b) => b.stars - a.stars)
    if (sortBy === 'name') return list.sort((a, b) => a.name.localeCompare(b.name))
    return list.sort((a, b) => b.issueCount - a.issueCount)
  }, [issues, search, sortBy])

  const totalIssues = repos.reduce((s, r) => s + r.issueCount, 0)

  return (
    <main className="repos-main">
      <div className="repos-header">
        <div>
          <div className="repos-title">Starred repositories</div>
          <div className="repos-subtitle">{repos.length} repos · {totalIssues} open issues</div>
        </div>
        <div className="repos-controls">
          <div style={{ position: 'relative' }}>
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter repos…"
              className="repos-search"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'issues' | 'stars' | 'name')}
            className="repos-sort-select"
          >
            <option value="issues">Most issues</option>
            <option value="stars">Most stars</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {repos.length === 0 ? (
        <div className="repos-empty">
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 6 }}>
            {search ? 'No repos match your search' : 'No repos found'}
          </div>
          {search && <button onClick={() => setSearch('')} className="secondary-btn">Clear search</button>}
        </div>
      ) : (
        <div className="repos-grid">
          {repos.map(r => <RepoCard key={r.name} repo={r} />)}
        </div>
      )}
    </main>
  )
}

function SettingsPanel({ notif, setNotif, login, rescanning, onRescan, onDisconnect, onDeleteAccount }: {
  notif: boolean
  setNotif: (v: boolean) => void
  login: string
  rescanning: boolean
  onRescan: () => void
  onDisconnect: () => void
  onDeleteAccount: () => Promise<void>
}) {
  const [imgErr, setImgErr] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  return (
    <main className="settings-main">

      {/* Profile card */}
      <div className="settings-profile">
        <div className="settings-profile__ring">
          {login && !imgErr
            ? <Image src={`https://github.com/${login}.png?size=128`} alt={login} width={64} height={64} className="settings-profile__img" onError={() => setImgErr(true)} />
            : <span className="settings-profile__letter">{login ? login[0].toUpperCase() : '?'}</span>
          }
        </div>
        <div className="settings-profile__name">{login || '—'}</div>
        {login && (
          <a href={`https://github.com/${login}`} target="_blank" rel="noopener noreferrer" className="settings-profile__handle">
            github.com/{login}
          </a>
        )}
      </div>

      {/* Preferences */}
      <div className="settings-group">
        <div className="settings-group__label">Preferences</div>
        <div className="settings-card">
          <div className="srow">
            <div className="srow__icon"><BellIcon /></div>
            <div className="srow__body">
              <div className="srow__label">Email notifications</div>
              <div className="srow__desc">Get notified when new issues appear in your starred repos</div>
            </div>
            <Toggle value={notif} onChange={setNotif} />
          </div>
        </div>
      </div>

      {/* Sync */}
      <div className="settings-group">
        <div className="settings-group__label">Data & Sync</div>
        <div className="settings-card">
          <div className="srow">
            <div className="srow__icon"><RefreshIcon /></div>
            <div className="srow__body">
              <div className="srow__label">Re-scan repositories</div>
              <div className="srow__desc">Sync your latest GitHub stars and rediscover open issues</div>
            </div>
            <button className="secondary-btn" onClick={onRescan} disabled={rescanning}>
              {rescanning ? 'Scanning…' : 'Rescan'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="settings-group">
        <div className="settings-group__label">Danger zone</div>
        <div className="settings-card settings-card--danger" style={{ marginBottom: 8 }}>
          <div className="srow">
            <div className="srow__icon srow__icon--danger"><UnlinkIcon /></div>
            <div className="srow__body">
              <div className="srow__label">Disconnect account</div>
              <div className="srow__desc">Signs you out of your account</div>
            </div>
            <button onClick={onDisconnect} className="danger-btn">Disconnect</button>
          </div>
        </div>
        <div className="settings-card settings-card--danger">
          <div className="srow">
            <div className="srow__icon srow__icon--danger"><TrashIcon /></div>
            <div className="srow__body">
              <div className="srow__label">Delete my account</div>
              <div className="srow__desc">Permanently deletes your account and all associated data. This cannot be undone.</div>
            </div>
            {!confirmDelete
              ? <button onClick={() => setConfirmDelete(true)} className="danger-btn">Delete</button>
              : <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Sure?</span>
                  <button onClick={() => setConfirmDelete(false)} className="secondary-btn">Cancel</button>
                  <button disabled={deleting} onClick={async () => {
                    setDeleting(true)
                    await onDeleteAccount()
                  }} className="danger-btn">{deleting ? 'Deleting…' : 'Yes, delete'}</button>
                </div>
            }
          </div>
        </div>
      </div>

    </main>
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

function ListViewIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><circle cx="3" cy="6" r=".5" fill="currentColor"/><circle cx="3" cy="12" r=".5" fill="currentColor"/><circle cx="3" cy="18" r=".5" fill="currentColor"/></svg>
}

function GridViewIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg>
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

function FilterIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
}

function BellIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}

function RefreshIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
}

function UnlinkIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"/><path d="m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"/><line x1="8" x2="8" y1="2" y2="5"/><line x1="2" x2="5" y1="8" y2="8"/><line x1="16" x2="16" y1="19" y2="22"/><line x1="19" x2="22" y1="16" y2="16"/></svg>
}

function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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
  .avatar--photo {
    object-fit: cover; display: block;
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
  .issue-owner-avatar {
    width: 16px; height: 16px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0; opacity: 0.75;
  }

  .view-toggle {
    width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border-default); border-radius: var(--radius-md);
    background: transparent; color: var(--fg-subtle); cursor: pointer;
    transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
  }
  .view-toggle:hover { background: var(--bg-hover); color: var(--fg-default); }
  .view-toggle--active { background: var(--bg-surface-2); color: var(--fg-default); border-color: var(--border-strong); }

  .issues-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 8px;
  }
  .issue-card {
    display: flex; flex-direction: column; gap: 10px;
    padding: 12px 14px; border-radius: 6px; border: 1px solid var(--border-default);
    background: var(--bg-surface); text-decoration: none;
    transition: background var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
  }
  .issue-card:hover { background: var(--bg-hover); border-color: var(--border-strong); box-shadow: var(--shadow-md); }
  .issue-card__header { display: flex; align-items: flex-start; gap: 8px; }
  .issue-card__title { font-size: 13px; font-weight: 500; color: var(--fg-default); line-height: 1.4; flex: 1; }
  .issue-card__footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .issue-card__repo { display: flex; align-items: center; gap: 5px; min-width: 0; }
  .issue-card__repo-name { font-family: var(--font-mono, monospace); font-size: 11px; color: var(--fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .issue-card__labels { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

  /* Repos grid */
  .repos-main { flex: 1; overflow-y: auto; padding: 24px 28px; }
  .repos-header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; flex-wrap: wrap; margin-bottom: 24px;
  }
  .repos-title { font-size: 16px; font-weight: 600; color: var(--fg-default); margin-bottom: 2px; }
  .repos-subtitle { font-size: 13px; color: var(--fg-muted); }
  .repos-controls { display: flex; align-items: center; gap: 8px; }
  .repos-search {
    height: 32px; padding-left: 32px; padding-right: 10px; width: 180px;
    border: 1px solid var(--border-strong); border-radius: 6px; font-size: 13px;
    font-family: inherit; background: var(--bg-surface); color: var(--fg-default); outline: none;
    transition: border-color var(--transition-fast);
  }
  .repos-search:focus { border-color: var(--border-focus); }
  .repos-sort-select {
    height: 32px; padding: 0 8px; border: 1px solid var(--border-strong);
    border-radius: 6px; font-size: 13px; font-family: inherit;
    background: var(--bg-surface); color: var(--fg-muted); outline: none; cursor: pointer;
  }
  .repos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }
  .repo-card {
    display: flex; flex-direction: column; gap: 12px;
    padding: 14px 16px; border-radius: 8px; border: 1px solid var(--border-default);
    background: var(--bg-surface); text-decoration: none;
    transition: background var(--transition-base), border-color var(--transition-base), box-shadow var(--transition-base);
  }
  .repo-card:hover {
    background: var(--bg-hover); border-color: var(--border-strong);
    box-shadow: var(--shadow-md);
  }
  .repo-card__top { display: flex; align-items: center; gap: 10px; }
  .repo-card__avatar {
    width: 32px; height: 32px; border-radius: 7px; flex-shrink: 0;
    overflow: hidden; background: var(--bg-surface-2);
    border: 1px solid var(--border-default);
    display: flex; align-items: center; justify-content: center;
  }
  .repo-card__avatar-img { width: 32px !important; height: 32px !important; object-fit: cover; display: block; }
  .repo-card__avatar-letter {
    font-size: 13px; font-weight: 700; color: var(--accent-fg);
    font-family: var(--font-mono, monospace);
  }
  .repo-card__meta { display: flex; flex-direction: column; min-width: 0; }
  .repo-card__owner { font-size: 11px; color: var(--fg-subtle); line-height: 1.3; }
  .repo-card__name {
    font-size: 13px; font-weight: 600; color: var(--fg-default);
    font-family: var(--font-mono, monospace);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .repo-card__bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .repo-card__chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .repo-card__chip {
    font-family: var(--font-mono, monospace); font-size: 11px;
    background: var(--bg-surface-2); border: 1px solid var(--border-default);
    padding: 1px 7px; border-radius: 999px; color: var(--fg-muted);
  }
  .repo-card__stars-chip {
    font-size: 11px; color: var(--fg-subtle);
    display: flex; align-items: center; gap: 3px;
  }
  .repo-card__badge {
    font-size: 11px; font-weight: 500; white-space: nowrap; flex-shrink: 0;
    background: var(--accent-subtle); color: var(--accent-fg);
    border: 1px solid var(--accent-muted); padding: 2px 8px; border-radius: 999px;
  }
  .repos-empty { text-align: center; padding: 64px 24px; }

  /* Sidebar backdrop — only renders on mobile */
  .sidebar-backdrop {
    display: none;
  }

  /* Mobile sidebar: fixed overlay drawer */
  @media (max-width: 767px) {
    .sidebar-backdrop {
      display: block;
      position: fixed; inset: 0; top: 48px;
      background: rgba(0,0,0,0.35); z-index: 99;
    }
    .dash-sidebar {
      position: fixed; top: 48px; left: 0; bottom: 0; z-index: 100;
      width: 260px !important;
      transform: translateX(0);
      transition: transform 220ms ease;
      box-shadow: 4px 0 20px rgba(0,0,0,0.12);
    }
    .dash-sidebar--hidden {
      transform: translateX(-100%) !important;
      pointer-events: none;
    }
  }

  /* Desktop sidebar: inline, hide by collapsing width */
  @media (min-width: 768px) {
    .dash-sidebar--hidden {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .repos-main { padding: 16px; }
    .repos-header { align-items: flex-start; }
    .repos-controls { width: 100%; }
    .repos-search { flex: 1; width: auto; min-width: 0; }
    .repos-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  }
  @media (max-width: 420px) {
    .repos-grid { grid-template-columns: 1fr; }
  }
  /* Settings ──────────────────────────────────────── */
  .settings-main {
    flex: 1; overflow-y: auto; padding: 32px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }

  .settings-profile {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 28px 24px 22px; width: 100%; max-width: 520px;
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-xl); box-shadow: var(--shadow-sm);
  }
  .settings-profile__ring {
    width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
    background: var(--bg-surface-2); overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--accent-muted);
    box-shadow: 0 0 0 4px var(--accent-subtle);
    margin-bottom: 6px;
  }
  .settings-profile__img { width: 64px !important; height: 64px !important; object-fit: cover; display: block; }
  .settings-profile__letter { font-size: 24px; font-weight: 700; color: var(--accent-fg); font-family: var(--font-mono, monospace); }
  .settings-profile__name { font-size: 15px; font-weight: 600; color: var(--fg-default); }
  .settings-profile__handle {
    font-size: 12px; color: var(--fg-subtle); font-family: var(--font-mono, monospace); text-decoration: none;
    transition: color var(--transition-fast);
  }
  .settings-profile__handle:hover { color: var(--accent-fg); }

  .settings-group { width: 100%; max-width: 520px; }
  .settings-group__label {
    font-size: 11px; font-weight: 500; letter-spacing: 0.06em;
    text-transform: uppercase; color: var(--fg-subtle);
    padding: 0 2px; margin-bottom: 6px;
  }
  .settings-card {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm);
  }
  .settings-card--danger {
    border-color: rgba(185,28,28,0.18); background: #fef9f9;
  }
  [data-theme="dark"] .settings-card--danger {
    border-color: rgba(239,68,68,0.18); background: rgba(239,68,68,0.04);
  }

  .srow { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
  .srow + .srow { border-top: 1px solid var(--border-default); }
  .srow__icon {
    width: 32px; height: 32px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-surface-2); border: 1px solid var(--border-default);
    border-radius: var(--radius-md); color: var(--fg-muted);
  }
  .srow__icon--danger {
    color: #B91C1C; background: #FEE2E2; border-color: rgba(185,28,28,0.2);
  }
  [data-theme="dark"] .srow__icon--danger {
    color: #FCA5A5; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.2);
  }
  .srow__body { flex: 1; min-width: 0; }
  .srow__label { font-size: 13px; font-weight: 500; color: var(--fg-default); }
  .srow__desc { font-size: 12px; color: var(--fg-muted); margin-top: 1px; line-height: 1.4; }

  .danger-btn {
    display: inline-flex; align-items: center; height: 28px; padding: 0 12px;
    font-size: 12px; font-weight: 500; border-radius: 6px; cursor: pointer;
    color: #B91C1C; background: #FEF2F2; border: 1px solid rgba(185,28,28,0.2);
    font-family: inherit; transition: background var(--transition-fast); flex-shrink: 0;
  }
  .danger-btn:hover { background: #FEE2E2; }

  @media (max-width: 600px) {
    .settings-main { padding: 20px 16px; }
    .srow { gap: 10px; flex-wrap: wrap; }
    .srow__body { min-width: calc(100% - 48px); }
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
