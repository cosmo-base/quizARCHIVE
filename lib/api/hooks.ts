'use client'

import { useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { api, isMockApi } from './client'
import { useSession } from './session'

/**
 * 画面で使うデータ取得。SWR のキーはログイン状態ごとに分ける。
 * モックのときは、モックのデータが変わったら（デモ設定など）取り直す。
 */
const opts = { revalidateOnFocus: false, keepPreviousData: true }

function who(session: ReturnType<typeof useSession>) {
  return session === undefined ? null : session ? session.token : 'guest'
}

export function useMockRevalidation() {
  const { mutate } = useSWRConfig()
  useEffect(() => {
    if (!isMockApi) return
    let unsubscribe: (() => void) | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    import('../store').then(({ subscribeStore }) => {
      if (cancelled) return
      unsubscribe = subscribeStore(() => {
        clearTimeout(timer)
        timer = setTimeout(() => mutate(() => true), 50)
      })
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
      unsubscribe?.()
    }
  }, [mutate])
}

export function useQuestionsIndex() {
  const s = useSession()
  return useSWR(who(s) ? ['questions.index'] : null, () => api.questionsIndex().then((r) => r.questions), opts)
}

export function useQuestionDetail(id: string) {
  const s = useSession()
  const w = who(s)
  return useSWR(w && id ? ['questions.get', id, w] : null, () => api.questionsGet(id), opts)
}

export function useNotices() {
  return useSWR(['notices.list'], () => api.noticesList().then((r) => r.notices), opts)
}

export function useMe() {
  const s = useSession()
  return useSWR(s ? ['me.get', s.token] : null, () => api.meGet().then((r) => r.me), opts)
}

export function useInProgress() {
  const s = useSession()
  const w = who(s)
  return useSWR(w ? ['attempts.inProgress', w] : null, () => api.attemptsInProgress().then((r) => r.attempts), opts)
}

export function useHistory() {
  const s = useSession()
  return useSWR(s ? ['history.list', s.token] : null, () => api.historyList().then((r) => r.attempts), opts)
}

export function useSolved() {
  const s = useSession()
  return useSWR(s ? ['history.questions', s.token] : null, () => api.historyQuestions().then((r) => r.rows), opts)
}

export function useAttempt(id: string) {
  const s = useSession()
  const w = who(s)
  return useSWR(w && id ? ['attempts.get', id, w] : null, () => api.attemptsGet(id), { ...opts, keepPreviousData: false })
}
