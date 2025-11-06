import { useMemo } from 'react'

import type { Submission, SubmissionStatus } from '../types'
import { getStatusMeta } from '../lib/status'
import MonacoCodeEditor from './MonacoCodeEditor'

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
  const languageLabel = useMemo(() => (language ?? 'python').toUpperCase(), [language])

  return (
    <section className="panel editor-panel">
      <div className="panel__header editor-panel__header">
        <div className="editor-panel__heading">
          <h2 className="panel__title">Solution Editor</h2>
          {statusMeta ? (
            <span className={`status-badge status-badge--${statusMeta.tone}`}>
              {pendingStatus && <span className="status-badge__spinner" />}
              {statusMeta.label}
            </span>
          ) : null}
        </div>
        <div className="editor-panel__toolbar">
          <span className="editor-panel__language">{languageLabel}</span>
          <button type="button" className="ghost-button" onClick={onReset}>
            Reset snippet
          </button>
        </div>
      </div>

      <div className="editor-panel__surface">
        <MonacoCodeEditor value={code} language={language} onChange={onCodeChange} />
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
