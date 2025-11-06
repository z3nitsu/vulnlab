import type { SubmissionStatus } from '../types'

type StatusTone = 'success' | 'danger' | 'warn' | 'info'

type StatusMeta = {
  label: string
  tone: StatusTone
}

const STATUS_META: Record<SubmissionStatus, StatusMeta> = {
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  running: { label: 'Running', tone: 'warn' },
  error: { label: 'Error', tone: 'danger' },
  pending: { label: 'Pending', tone: 'info' },
}

export function getStatusMeta(status: SubmissionStatus | null): StatusMeta | null {
  if (!status) return null
  return STATUS_META[status] ?? STATUS_META.pending
}
