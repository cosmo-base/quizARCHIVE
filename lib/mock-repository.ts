'use client'

import { mockConfig } from './config'
import { actions, getAllQuestions, getState } from './store'
import { buildQuestion } from './stats'
import type { ReportReason } from './types'

/** API風のモックデータ取得層。実際の通信は行わない */
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchQuestions() {
  await wait(mockConfig.repository.latencyMs)
  const state = getState()
  if (state.demo.listError) throw new Error('問題を読み込めませんでした')
  return getAllQuestions(state)
}

export async function fetchQuestion(id: string) {
  await wait(mockConfig.repository.latencyMs / 2)
  const state = getState()
  if (state.demo.listError) throw new Error('問題を読み込めませんでした')
  return buildQuestion(id, state.stats) ?? null
}

export async function submitReport(input: { questionId: string; versionId: string; reason: ReportReason; detail: string }) {
  await wait(800)
  if (getState().demo.reportFailure) throw new Error('送信できませんでした')
  actions.addReport(input)
}
