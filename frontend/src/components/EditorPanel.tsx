import { lazy, Suspense } from 'react'

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

  return (
    <section className="panel editor">
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
        <button type="button" className="ghost-button" onClick={onReset}>
          Reset snippet
        </button>
      </div>

      <div className="editor__surface">
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
  )
}
