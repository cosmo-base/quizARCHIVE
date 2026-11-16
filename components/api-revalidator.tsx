'use client'

import { useMockRevalidation } from '@/lib/api/hooks'

/** モックのAPIのとき、モックのデータが変わったら画面のデータを取り直す */
export function ApiRevalidator() {
  useMockRevalidation()
  return null
}
