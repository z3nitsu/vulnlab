import axios, { AxiosHeaders } from 'axios'

import type {
  ChallengeDetail,
  ChallengeSummary,
  Submission,
  SubmissionStats,
} from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'
const API_KEY = import.meta.env.VITE_API_KEY ?? ''

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  if (!API_KEY) {
    return config
  }

  if (!config.headers) {
    config.headers = new AxiosHeaders()
  }

  if (config.headers instanceof AxiosHeaders) {
    config.headers.set('X-API-Key', API_KEY)
  } else {
    ;(config.headers as Record<string, string>)['X-API-Key'] = API_KEY
  }

  return config
})

export async function fetchChallenges() {
  const res = await client.get<ChallengeSummary[]>('/challenges')
  return res.data
}

export async function fetchChallenge(slug: string) {
  const res = await client.get<ChallengeDetail>(`/challenges/${slug}`)
  return res.data
}

export interface SubmissionPayload {
  challenge_slug: string
  code: string
  user_handle?: string | null
}

export async function createSubmission(payload: SubmissionPayload) {
  const res = await client.post<Submission>('/submissions', payload)
  return res.data
}

export async function fetchSubmission(submissionId: string) {
  const res = await client.get<Submission>(`/submissions/${submissionId}`)
  return res.data
}

export async function fetchSubmissionStats() {
  const res = await client.get<SubmissionStats>('/stats/submissions')
  return res.data
}
