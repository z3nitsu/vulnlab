import { Fragment, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import type { Submission, SubmissionStatus } from '../types'
import { getStatusMeta } from '../lib/status'
import MonacoCodeEditor from './MonacoCodeEditor'
import { TestResultPanel } from './InsightsPanel'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'results'>('code')

  useEffect(() => {
    if (!isExpanded) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  const handleExpand = () => {
    setIsExpanded(true)
  }

  const handleCollapse = () => {
    setIsExpanded(false)
  }

  const renderStatusBadge = () =>
    statusMeta ? (
      <span className={`status-badge status-badge--${statusMeta.tone}`}>
        {pendingStatus && <span className="status-badge__spinner" />}
        {statusMeta.label}
      </span>
    ) : null

  const handleSubmitClick = () => {
    setActiveTab('results')
    onSubmit()
  }

  return (
    <Fragment>
      <section className="panel editor-panel">
        <div className="panel__header editor-panel__header">
          <div className="editor-panel__heading">
            <h2 className="panel__title">Solution Editor</h2>
            {renderStatusBadge()}
          </div>
          <div className="editor-panel__toolbar">
            <span className="editor-panel__language">{languageLabel}</span>
            <button type="button" className="ghost-button" onClick={onReset}>
              Reset snippet
            </button>
            <button
              type="button"
              className="ghost-button ghost-button--icon"
              onClick={handleExpand}
              aria-label="Open fullscreen editor"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3.5 6.5V3.5H6.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 9.5V12.5H9.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.5 6.5V3.5H9.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.5 9.5V12.5H6.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="editor-panel__switcher">
          <button
            type="button"
            className={`editor-tab${activeTab === 'code' ? ' editor-tab--active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Editor
          </button>
          <button
            type="button"
            className={`editor-tab${activeTab === 'results' ? ' editor-tab--active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
        </div>

        {activeTab === 'code' ? (
          <>
            <div className="editor-panel__surface">
              <MonacoCodeEditor value={code} language={language} onChange={onCodeChange} />
            </div>

            <div className="editor__actions">
              <button
                type="button"
                className="primary-button"
                onClick={handleSubmitClick}
                disabled={!canSubmit || Boolean(pendingStatus)}
              >
                {pendingStatus ? 'Submitting…' : 'Submit fix'}
              </button>
            </div>
          </>
        ) : (
          <div className="editor-panel__results">
            <TestResultPanel
              submission={submission}
              pendingStatus={pendingStatus}
              variant="inline"
            />
          </div>
        )}
      </section>
      {isExpanded
        ? createPortal(
            <Fragment>
              <div className="editor-modal-overlay" onClick={handleCollapse} />
              <div className="editor-modal" role="dialog" aria-modal="true">
                <div className="editor-shell editor-shell--floating">
                  <div className="panel__header editor-panel__header">
                    <div className="editor-panel__heading">
                      <h2 className="panel__title">Solution Editor</h2>
                      {renderStatusBadge()}
                    </div>
                    <div className="editor-panel__toolbar">
                      <span className="editor-panel__language">{languageLabel}</span>
                      <button type="button" className="ghost-button" onClick={onReset}>
                        Reset snippet
                      </button>
                      <button
                        type="button"
                        className="ghost-button ghost-button--icon"
                        onClick={handleCollapse}
                        aria-label="Close editor"
                      >
                        X
                      </button>
                    </div>
                  </div>
                  <div className="editor-panel__surface">
                    <MonacoCodeEditor
                      value={code}
                      language={language}
                      onChange={onCodeChange}
                      height="68vh"
                    />
                  </div>
                  <div className="editor__actions">
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleSubmitClick}
                      disabled={!canSubmit || Boolean(pendingStatus)}
                    >
                      {pendingStatus ? 'Submitting…' : 'Submit fix'}
                    </button>
                  </div>
                </div>
              </div>
            </Fragment>,
            document.body,
          )
        : null}
    </Fragment>
  )
}
