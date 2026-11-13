'use client'

import { useSearchParams } from 'next/navigation'

/** URLのクエリパラメータ id を読み取る（静的書き出しでIDを渡すため） */
export function useIdFromQuery() {
  return useSearchParams().get('id') ?? ''
}
