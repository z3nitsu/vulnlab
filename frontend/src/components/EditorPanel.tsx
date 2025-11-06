import type { Submission, SubmissionStatus } from '../types'
import { getStatusMeta } from '../lib/status'

type Props = {
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
  onReset: () => void
  canSubmit: boolean
  pendingStatus: SubmissionStatus | null
  submission: Submission | null
}

export function EditorPanel({
  code,
  onCodeChange,
  onSubmit,
  onReset,
  canSubmit,
  pendingStatus,
  submission,
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

      <textarea
        className="editor__textarea"
        value={code}
        onChange={(event) => onCodeChange(event.target.value)}
        placeholder="Write your secure fix here..."
      />

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
