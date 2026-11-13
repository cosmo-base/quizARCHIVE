'use client'

import { LinkButton } from '@/components/link-button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, CheckCircle2, Eye, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/shell/page'
import { ChoiceList } from '@/components/quiz/choice-list'
import { ExplanationBlock } from '@/components/quiz/explanation-block'
import { QuestionMeta } from '@/components/quiz/question-meta'
import { ReportDialog } from '@/components/quiz/report-dialog'
import { mockConfig } from '@/lib/config'
import { fetchQuestion } from '@/lib/mock-repository'
import { actions, ownerKeyOf, useAppState } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useIdFromQuery } from '@/components/id-from-query'

export function QuestionDetailViewFromQuery() {
  return <QuestionDetailView id={useIdFromQuery()} />
}

export function QuestionDetailView({ id }: { id: string }) {
  const state = useAppState()
  const router = useRouter()
  const { data: q, error, mutate } = useSWR(state ? ['question', id, state.statsRevision] : null, () => fetchQuestion(id), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selfCheck, setSelfCheck] = useState<string | null>(null)
  /** 解き直し中の選択（null＝解き直していない）と、その結果 */
  const [retry, setRetry] = useState<{ choiceId: string | null; result: boolean | null } | null>(null)

  const back = () => {
    if (window.history.length > 1) router.back()
    else router.push('/questions')
  }

  const backButton = (
    <Button variant="ghost" className="h-11 self-start px-2" onClick={back}>
      <ArrowLeft aria-hidden="true" />
      一覧に戻る
    </Button>
  )

  if (error) {
    return (
      <PageContainer narrow>
        {backButton}
        <div role="alert" className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
          <p className="font-bold">問題を読み込めませんでした</p>
          <Button variant="outline" className="h-11" onClick={() => mutate()}>
            <RefreshCw aria-hidden="true" />
            再読み込み
          </Button>
        </div>
      </PageContainer>
    )
  }

  if (!state || q === undefined) {
    return (
      <PageContainer narrow>
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-96 rounded-2xl" />
      </PageContainer>
    )
  }

  if (q === null) {
    return (
      <PageContainer narrow>
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-12 text-center">
          <p className="font-bold">問題が見つかりません</p>
          <LinkButton href="/questions" variant="outline" className="h-11">過去問一覧へ</LinkButton>
        </div>
      </PageContainer>
    )
  }

  const record = state.singleAnswers[ownerKeyOf(state)]?.[q.id]
  const answered = Boolean(record && !record.explanationOnly)
  const explanationOnly = Boolean(record?.explanationOnly)
  const revealed = answered || explanationOnly

  const submit = () => {
    if (!selected || submitting || record) return
    setSubmitting(true)
    window.setTimeout(() => {
      actions.answerSingle(q.id, selected)
      setSubmitting(false)
    }, mockConfig.attempt.saveDelayMs)
  }

  const retrying = retry !== null && retry.result === null
  const retryDone = retry !== null && retry.result !== null
  const choiceValue = retry ? retry.choiceId : answered ? record!.choiceId : explanationOnly ? selfCheck : selected
  const submitRetry = () => {
    if (!retry?.choiceId || retry.result !== null) return
    actions.retrySingle(q.id, retry.choiceId)
    setRetry({ ...retry, result: retry.choiceId === q.correctChoiceId })
  }

  return (
    <PageContainer narrow>
      {backButton}
      <article className="flex flex-col gap-6 rounded-2xl border bg-card p-5 shadow-xs md:p-8">
        <header className="flex flex-col gap-4">
          <QuestionMeta questionId={q.id} fieldId={q.fieldId} difficulty={q.difficulty} accuracy={q.displayAccuracy} />
          <h1 className="text-lg leading-relaxed font-bold text-pretty md:text-xl">{q.text}</h1>
        </header>

        <ChoiceList
          name={`single-${q.id}`}
          legend="選択肢"
          choices={q.choices}
          value={choiceValue}
          onChange={retrying ? (c) => setRetry({ choiceId: c, result: null }) : explanationOnly ? setSelfCheck : setSelected}
          disabled={retrying ? false : answered || submitting}
          reveal={retrying ? undefined : answered || (explanationOnly && selfCheck) ? { correctChoiceId: q.correctChoiceId } : undefined}
        />

        {!revealed && (
          <div className="flex flex-col gap-3">
            <Button className="h-12 text-base" disabled={!selected || submitting} onClick={submit}>
              {submitting && <Loader2 aria-hidden="true" className="animate-spin" />}
              {submitting ? '確定しています…' : '回答する'}
            </Button>
            {mockConfig.singleQuestion.allowExplanationOnly && (
              <Button variant="ghost" className="h-11 text-muted-foreground" disabled={submitting} onClick={() => actions.viewExplanationOnly(q.id)}>
                <Eye aria-hidden="true" />
                回答せずに解説を見る
              </Button>
            )}
          </div>
        )}

        {retrying && (
          <div className="flex flex-col gap-3">
            <Button className="h-12 text-base" disabled={!retry?.choiceId} onClick={submitRetry}>
              解き直しの回答をする
            </Button>
            <Button variant="ghost" className="h-11 text-muted-foreground" onClick={() => setRetry(null)}>
              解き直しをやめる
            </Button>
          </div>
        )}

        <div aria-live="polite" className="flex flex-col gap-4">
          {answered && !retry && (
            <ResultLine correct={Boolean(record!.correct)} />
          )}
          {retryDone && <ResultLine correct={Boolean(retry!.result)} />}
          {retry && <p className="text-sm text-muted-foreground">解き直しの回答は記録されますが、正答率の集計には含まれません。</p>}
          {answered && !retrying && (
            <Button variant="outline" className="h-11 self-start" onClick={() => setRetry({ choiceId: null, result: null })}>
              もう一度解く
            </Button>
          )}
          {explanationOnly && (
            <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              解説を先に見たため、この問題の回答は正答率に含まれません。選択肢を選ぶと正解を確認できます。
            </p>
          )}
          {revealed && !retrying && <ExplanationBlock explanation={q.explanation} references={q.references} />}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <p className="text-xs text-muted-foreground">表示中の正答率は、解説を見る前の回答から集計しています。</p>
          <ReportDialog questionId={q.id} versionId={q.versionId} />
        </footer>
      </article>
    </PageContainer>
  )
}

function ResultLine({ correct }: { correct: boolean }) {
  const Icon = correct ? CheckCircle2 : XCircle
  return (
    <p className={cn('flex items-center gap-2 text-lg font-bold', correct ? 'text-success' : 'text-destructive')}>
      <Icon aria-hidden="true" className="size-6" />
      {correct ? '正解です' : '不正解です'}
    </p>
  )
}
