import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ChallengeSidebar } from './components/ChallengeSidebar'
import { ChallengeSummaryPanel } from './components/ChallengeSummaryPanel'
import { EditorPanel } from './components/EditorPanel'
import { InsightsPanel } from './components/InsightsPanel'
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
const DEFAULT_HANDLE = import.meta.env.VITE_DEFAULT_USER_HANDLE ?? 'coder1'

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
  const [userHandle, setUserHandle] = useState(
    () => localStorage.getItem('vulnlabs.handle') ?? DEFAULT_HANDLE
  )

  const pollerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearPoller = useCallback(() => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current)
      pollerRef.current = null
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('vulnlabs.handle', userHandle)
  }, [userHandle])

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
        user_handle: userHandle || undefined,
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
  }, [selectedSlug, code, userHandle, pollSubmission])

  useEffect(() => clearPoller, [clearPoller])

  const canSubmit = useMemo(() => Boolean(code.trim().length), [code])

  return (
    <div className="app">
      <header className="app__header">
        <div className="container header__content">
          <div>
            <span className="brand-chip">VulnLabs</span>
            <p className="muted small">Secure coding arena for remediating real-world bugs.</p>
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
        <ChallengeSidebar
          challenges={challenges}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
          isLoading={listLoading}
        />

        <div className="layout__main">
          <ChallengeSummaryPanel challenge={challengeDetail} isLoading={detailLoading} />
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

        <InsightsPanel
          challenge={challengeDetail}
          submission={submission}
          userHandle={userHandle}
          onHandleChange={setUserHandle}
        />
      </main>
    </div>
  )
}

export default App
