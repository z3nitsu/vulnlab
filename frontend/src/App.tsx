import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChallengeSidebar } from './components/ChallengeSidebar'
import { ChallengeSummaryPanel } from './components/ChallengeSummaryPanel'
import { EditorPanel } from './components/EditorPanel'
import {
  createSubmission,
  fetchChallenge,
  fetchChallenges,
  fetchSubmission,
} from './lib/api'
import type {
  ChallengeDetail,
  ChallengeSummary,
  Submission,
  SubmissionStatus,
} from './types'

const POLL_INTERVAL_MS = 1500
function App() {
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [challengeDetail, setChallengeDetail] = useState<ChallengeDetail | null>(null)
  const [code, setCode] = useState('')
  const [listLoading, setListLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [pendingStatus, setPendingStatus] = useState<SubmissionStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPoller = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current)
      pollerRef.current = null
    }
  }, [])

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        setListLoading(true)
        const data = await fetchChallenges()
        setChallenges(data)
        if (!selectedSlug && data.length) {
          setSelectedSlug(data[0].slug)
        }
      } catch (err) {
        console.error(err)
        setError('Unable to load challenges. Check backend availability.')
      } finally {
        setListLoading(false)
      }
    }

    loadChallenges()
  }, [])

  useEffect(() => {
    if (!selectedSlug) {
      setChallengeDetail(null)
      return
    }

    const loadDetail = async () => {
      try {
        setDetailLoading(true)
        const data = await fetchChallenge(selectedSlug)
        setChallengeDetail(data)
        setCode(data.vulnerable_snippet)
        setSubmission(null)
        setPendingStatus(null)
      } catch (err) {
        console.error(err)
        setError('Unable to load challenge detail.')
      } finally {
        setDetailLoading(false)
      }
    }

    loadDetail()
    clearPoller()
  }, [selectedSlug, clearPoller])

  const pollSubmission = useCallback(
    (submissionId: string) => {
      clearPoller()
      pollerRef.current = setInterval(async () => {
        try {
          const latest = await fetchSubmission(submissionId)
          setSubmission(latest)
          if (latest.status !== 'pending' && latest.status !== 'running') {
            setPendingStatus(null)
            clearPoller()
          } else {
            setPendingStatus(latest.status)
          }
        } catch (err) {
          console.error(err)
          setPendingStatus(null)
          clearPoller()
        }
      }, POLL_INTERVAL_MS)
    },
    [clearPoller]
  )

  const handleSubmit = useCallback(async () => {
    if (!selectedSlug) return
    try {
      setPendingStatus('pending')
      const result = await createSubmission({
        challenge_slug: selectedSlug,
        code,
      })
      setSubmission(result)
      setPendingStatus(result.status === 'pending' ? result.status : null)

      if (result.status === 'pending' || result.status === 'running') {
        pollSubmission(result.id)
      }
    } catch (err) {
      console.error(err)
      setPendingStatus(null)
      setError('Submission failed. Please confirm the backend API key and server are configured.')
    }
  }, [selectedSlug, code, pollSubmission])

  useEffect(() => clearPoller, [clearPoller])

  const canSubmit = useMemo(() => Boolean(code.trim().length), [code])

  return (
    <div className="app">
      <header className="app__header">
        <div className="container header__content">
          <div className="header__brand">
            <button
              type="button"
              className="menu-button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open challenge catalog"
              aria-expanded={isSidebarOpen}
            >
              <span />
            </button>
            <div>
              <span className="brand-chip">VulnLabs</span>
              <p className="muted small">Secure coding arena for remediating real-world bugs.</p>
            </div>
          </div>
          {detailLoading && (
            <div className="header__loading">
              <span className="status-badge status-badge--info">
                <span className="status-badge__spinner" />
                Loading challenge…
              </span>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="banner banner--error">
          <div className="container banner__content">
            <span>{error}</span>
            <button type="button" className="ghost-button ghost-button--light" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="container layout">
        <div className="workspace">
          <div className="workspace__panel workspace__panel--left">
            <ChallengeSummaryPanel challenge={challengeDetail} isLoading={detailLoading} />
          </div>
          <div className="workspace__panel workspace__panel--right">
            <EditorPanel
              code={code}
              onCodeChange={setCode}
              onSubmit={handleSubmit}
              onReset={() => setCode(challengeDetail?.vulnerable_snippet ?? '')}
              canSubmit={canSubmit}
              pendingStatus={pendingStatus}
              submission={submission}
              language={challengeDetail?.language}
            />
          </div>
        </div>

        {isSidebarOpen ? (
          <>
            <div className="drawer-overlay" onClick={() => setIsSidebarOpen(false)} />
            <div className="sidebar-drawer">
              <ChallengeSidebar
                challenges={challenges}
                selectedSlug={selectedSlug}
                onSelect={(slug) => {
                  setSelectedSlug(slug)
                  setIsSidebarOpen(false)
                }}
                isLoading={listLoading}
                className="sidebar--drawer"
                onClose={() => setIsSidebarOpen(false)}
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

export default App
