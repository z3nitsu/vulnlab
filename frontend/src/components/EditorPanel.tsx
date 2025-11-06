import { lazy, Suspense, useEffect, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'

import type { Submission, SubmissionStatus } from '../types'
import { getStatusMeta } from '../lib/status'

const MonacoCodeEditor = lazy(() => import('./MonacoCodeEditor'))

type Props = {
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
  onReset: () => void
  canSubmit: boolean
  pendingStatus: SubmissionStatus | null
  submission: Submission | null
  language?: string
}

export function EditorPanel({
  code,
  onCodeChange,
  onSubmit,
  onReset,
  canSubmit,
  pendingStatus,
  submission,
  language,
}: Props) {
  const status = pendingStatus ?? submission?.status ?? null
  const statusMeta = getStatusMeta(status)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isExpanded])

  const toggleExpanded = () => setIsExpanded((prev) => !prev)

  return (
    <>
      {isExpanded && <div className="editor-overlay" />}
      <section className={`panel editor${isExpanded ? ' editor--expanded' : ''}`}>
        <div className="panel__header editor__header">
          <div className="editor__heading">
            <h2 className="panel__title">Solution Editor</h2>
            {statusMeta ? (
              <span className={`status-badge status-badge--${statusMeta.tone}`}>
                {pendingStatus && <span className="status-badge__spinner" />}
                {statusMeta.label}
              </span>
            ) : null}
          </div>
        <div className="editor__toolbar">
          <span className="editor__language-chip">{(language ?? 'python').toUpperCase()}</span>
          <button
            type="button"
            className="ghost-button ghost-button--subtle"
            onClick={toggleExpanded}
            aria-label={isExpanded ? 'Collapse editor' : 'Expand editor'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button type="button" className="ghost-button" onClick={onReset}>
            Reset snippet
          </button>
        </div>
        </div>

        <div className={`editor__surface${isExpanded ? ' editor__surface--expanded' : ''}`}>
          <Suspense
            fallback={
              <textarea
                className="editor__textarea editor__textarea--loading"
                value={code}
                readOnly
                placeholder="Loading editor…"
              />
            }
          >
            <MonacoCodeEditor value={code} language={language} onChange={onCodeChange} />
          </Suspense>
        </div>

        <div className="editor__actions">
          <button
            type="button"
            className="primary-button"
            onClick={onSubmit}
            disabled={!canSubmit || Boolean(pendingStatus)}
          >
            {pendingStatus ? 'Submitting…' : 'Submit fix'}
          </button>
        </div>
      </section>
    </>
  )
}
