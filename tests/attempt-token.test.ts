import { test } from 'node:test'
import assert from 'node:assert/strict'

// ブラウザの localStorage の代わり
const store = new Map<string, string>()
;(globalThis as unknown as { window: unknown }).window = {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
  addEventListener() {},
  removeEventListener() {},
}

test('回を始めたときのトークンを覚え、取り出し、忘れられる', async () => {
  const { pinAttemptToken, getAttemptToken, forgetAttemptToken } = await import('../lib/api/session')
  pinAttemptToken('att-1', 'tok-a')
  assert.equal(getAttemptToken('att-1'), 'tok-a')
  assert.equal(getAttemptToken('att-2'), null)
  forgetAttemptToken('att-1')
  assert.equal(getAttemptToken('att-1'), null)
})

test('2日より古いものは捨てる', async () => {
  const { getAttemptToken } = await import('../lib/api/session')
  store.set('cosmo-quiz-attempt-tokens', JSON.stringify({ old: { token: 't', at: Date.now() - 3 * 86400000 }, fresh: { token: 'u', at: Date.now() } }))
  assert.equal(getAttemptToken('old'), null)
  assert.equal(getAttemptToken('fresh'), 'u')
})

test('ログインの期限は延びたときだけ書き換える', async () => {
  const { setSession, getSession, updateSessionExpiry } = await import('../lib/api/session')
  setSession({ token: 'tok', displayName: 'x', expiresAt: '2030-01-01T00:00:00.000Z' })
  updateSessionExpiry('2029-01-01T00:00:00.000Z')
  assert.equal(getSession()?.expiresAt, '2030-01-01T00:00:00.000Z')
  updateSessionExpiry('2030-02-01T00:00:00.000Z')
  assert.equal(getSession()?.expiresAt, '2030-02-01T00:00:00.000Z')
  updateSessionExpiry(null)
  assert.equal(getSession()?.expiresAt, '2030-02-01T00:00:00.000Z')
})
