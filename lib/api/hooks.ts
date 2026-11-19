'use client'

import { useEffect } from 'react'
import useSWR, { mutate as globalMutate, useSWRConfig } from 'swr'
import { api } from './client'
import { getSession, useSession } from './session'
import type { AttemptDetail, StartAttemptParams } from './types'

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
    // ビルド時に GAS の URL が設定されていれば、この処理（とモックのデータ）は配信ファイルに含まれない
    if (process.env.NEXT_PUBLIC_API_URL) return
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

/* ---------- 回の開始・終了のあと、古いデータを出さないための処理 ---------- */

/** 本人の状態（レベル・回答中の回・履歴）を表すデータ */
type UserStateKey = 'me.get' | 'attempts.inProgress' | 'history.list' | 'history.questions'
const ALL_USER_STATE: UserStateKey[] = ['me.get', 'attempts.inProgress', 'history.list', 'history.questions']

/**
 * 一時保存（キャッシュ）を消して取り直す。取り直す間は古い内容を出さず、読み込み中の表示にする。
 * GAS につないでいるときは、これをしないと前のデータが残る（モックはデータが変わるたびに取り直している）
 */
export function refreshUserState(keys: UserStateKey[] = ALL_USER_STATE) {
  const set = new Set<string>(keys)
  return globalMutate((key) => Array.isArray(key) && set.has(String(key[0])), undefined, { revalidate: true })
}

/** 回のデータを一時保存に入れる。次の画面で同じ回を GAS から読み直さずに済む */
function primeAttempt(a: AttemptDetail) {
  const s = getSession()
  return globalMutate(['attempts.get', a.id, s ? s.token : 'guest'], a, { revalidate: false })
}

/** 回を始める。回答中の回・履歴の一覧を取り直す */
export async function startAttempt(p: StartAttemptParams) {
  const a = await api.attemptsStart(p)
  await primeAttempt(a)
  void refreshUserState(['attempts.inProgress', 'history.list'])
  return a
}

/**
 * 回を終える。採点結果を一時保存に入れる（結果の画面が採点前のデータを読まないように）。
 * 本人の状態の取り直しは、回の画面が採点済みのデータを受け取ったときに行う（attempt-view.tsx）
 */
export async function finishAttempt(p: { attemptId: string; answers: Record<string, string | null>; seq: number }) {
  const a = await api.attemptsFinish(p)
  await primeAttempt(a)
  return a
}
