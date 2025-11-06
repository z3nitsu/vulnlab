import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ClipboardCheck, Maximize2, Minimize2, RotateCcw } from 'lucide-react'

import type { Submission, SubmissionStatus } from '../types'
import { getStatusMeta } from '../lib/status'
import type { HeuristicIssue } from '../lib/heuristics'

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

const ExpandedShell = ({ children }: { children: React.ReactNode }) => {
  const node = useMemo(() => document.createElement('div'), [])

  useEffect(() => {
    document.body.appendChild(node)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.body.removeChild(node)
    }
  }, [node])

  return createPortal(children, node)
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
  const [heuristicIssues, setHeuristicIssues] = useState<HeuristicIssue[]>([])

  const toggleExpanded = () => setIsExpanded((prev) => !prev)

  useEffect(() => {
    if (!isExpanded) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExpanded])

  const editorContent = (
    <div className={`editor-shell ${isExpanded ? 'editor-shell--floating' : ''}`}>
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
          <button type="button" className="ghost-button ghost-button--subtle" onClick={onReset}>
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="editor__surface">
        <Suspense fallback={<textarea className="editor__textarea editor__textarea--loading" value={code} readOnly />}>
          <MonacoCodeEditor
            value={code}
            onChange={onCodeChange}
            language={language}
            onIssuesChange={setHeuristicIssues}
          />
        </Suspense>
      </div>

      <div className="editor__actions">
        <button type="button" className="primary-button" onClick={onSubmit} disabled={!canSubmit || Boolean(pendingStatus)}>
          {pendingStatus ? 'Submitting…' : 'Submit fix'}
        </button>
      </div>

      {heuristicIssues.length > 0 && (
        <div className="editor-hints">
          <div className="editor-hints__title">
            <ClipboardCheck size={16} />
            <span>Heuristic reminders</span>
          </div>
          <ul className="editor-hints__list">
            {heuristicIssues.map((issue) => (
              <li key={issue.id} className={`editor-hints__item editor-hints__item--${issue.severity}`}>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <>
      {isExpanded && (
        <ExpandedShell>
          <div className="editor-modal-overlay" onClick={toggleExpanded} />
          <div className="editor-modal">{editorContent}</div>
        </ExpandedShell>
      )}

      <section className="panel editor-shell-root">
        {isExpanded ? (
          <div className="editor-shell-placeholder">
            Editor expanded — press the minimize icon or Esc to return.
          </div>
        ) : (
          editorContent
        )}
      </section>
    </>
  )
}
