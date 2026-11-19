import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeReturnTo } from '../lib/auth/discord'

test('ログイン後の戻り先はサイト内のパスだけ', () => {
  assert.equal(safeReturnTo('/tests'), '/tests')
  assert.equal(safeReturnTo('/questions/detail?id=Q-0001'), '/questions/detail?id=Q-0001')
  assert.equal(safeReturnTo('https://example.com/'), '/')
  assert.equal(safeReturnTo('//example.com'), '/')
  assert.equal(safeReturnTo('/\\example.com'), '/')
  assert.equal(safeReturnTo('/auth/callback?code=x'), '/')
  assert.equal(safeReturnTo(undefined), '/')
})
