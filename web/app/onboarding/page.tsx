'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<'scanning' | 'done' | 'error'>('scanning')
  const [synced, setSynced] = useState(0)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
    fetch(`${apiUrl}/sync-stars`, { method: 'POST', credentials: 'include' })
      .then(async res => {
        if (!res.ok) throw new Error(`sync failed: ${res.status}`)
        const data = await res.json() as { synced: number }
        setSynced(data.synced)
        setPhase('done')
      })
      .catch(err => {
        console.error('sync-stars error', err)
        setPhase('error')
      })
  }, [])

  return (
    <>
      <style>{css}</style>
      <div className="ob-page">
        <div className="ob-logo">Hello<span className="accent">Commit</span></div>

        {phase === 'scanning' && (
          <div className="ob-content">
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 8 }}>
                Syncing your starred repos…
              </div>
              <div style={{ fontSize: 14, color: 'var(--fg-muted)' }}>
                Fetching your GitHub stars and looking for Good First Issues.
              </div>
            </div>

            <div className="progress-track">
              <div className="progress-fill progress-fill--indeterminate" />
            </div>

            <div className="scan-log">
              <div className="scan-log__header">
                <LoadingSpinner />
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono, monospace)' }}>syncing…</span>
              </div>
              <div style={{ padding: '20px 14px', fontSize: 13, color: 'var(--fg-subtle)' }}>
                This usually takes a few seconds.
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="ob-content" style={{ textAlign: 'center' }}>
            <div className="done-icon">
              <CheckCircleIcon />
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 10 }}>
              Synced {synced} starred {synced === 1 ? 'repo' : 'repos'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6, marginBottom: 32 }}>
              Good First Issues from your starred repositories are now available. We&apos;ll keep them updated.
            </div>
            <button onClick={() => router.push('/dashboard')} className="done-btn">
              Browse issues
              <ChevronRightIcon />
            </button>
          </div>
        )}

        {phase === 'error' && (
          <div className="ob-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--fg-default)', marginBottom: 10 }}>
              Something went wrong
            </div>
            <div style={{ fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6, marginBottom: 32 }}>
              We couldn&apos;t sync your starred repos. You can try again from the dashboard.
            </div>
            <button onClick={() => router.push('/dashboard')} className="done-btn">
              Go to dashboard
              <ChevronRightIcon />
            </button>
          </div>
        )}
      </div>
    </>
  )
}

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
  @keyframes indeterminate { 0% { left: -40%; width: 40%; } 60% { left: 100%; width: 40%; } 100% { left: 100%; width: 40%; } }

  .ob-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    flex-direction: column; background: var(--bg-base); padding: 32px 24px;
  }
  .ob-logo { font-weight: 600; font-size: 20px; letter-spacing: -0.02em; margin-bottom: 48px; }
  .accent { color: var(--accent-fg); }
  .ob-content { width: 100%; max-width: 480px; }

  .progress-track {
    background: var(--border-default); border-radius: 999px;
    height: 4px; margin-bottom: 32px; overflow: hidden;
  }
  .progress-fill {
    height: 100%; background: var(--accent); border-radius: 999px;
    transition: width 300ms ease-out;
  }
  .progress-fill--indeterminate {
    position: relative; width: 40%;
    animation: indeterminate 1.4s ease-in-out infinite;
  }

  .scan-log {
    background: var(--bg-surface); border: 1px solid var(--border-default);
    border-radius: 8px; overflow: hidden; text-align: left; min-height: 160px;
  }
  .scan-log__header {
    padding: 8px 14px; border-bottom: 1px solid var(--border-default);
    display: flex; align-items: center; gap: 6px;
  }
  .scan-log__row {
    padding: 7px 14px; border-bottom: 1px solid var(--border-default);
    display: flex; align-items: center; justify-content: space-between;
  }
  .scan-log__row:last-child { border-bottom: none; }
  .issue-badge {
    font-size: 11px; font-weight: 500;
    background: var(--accent-subtle); color: var(--accent-fg);
    border: 1px solid var(--accent-muted);
    padding: 1px 7px; border-radius: 999px;
    font-family: var(--font-mono, monospace);
  }

  .done-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--accent-subtle); border: 1px solid var(--accent-muted);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 24px; color: var(--accent-fg);
  }
  .done-btn {
    display: inline-flex; align-items: center; gap: 6px;
    height: 40px; padding: 0 20px;
    background: var(--accent); color: #fff; border: none;
    border-radius: var(--radius-md); font-family: inherit;
    font-size: 14px; font-weight: 500; cursor: pointer;
    transition: background var(--transition-base);
    margin: 0 auto;
  }
  .done-btn:hover { background: var(--accent-hover); }
  .loading-spinner { animation: spin 0.8s linear infinite; }
`

function LoadingSpinner() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loading-spinner">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
