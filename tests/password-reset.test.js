import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { authenticateUser, createUserAccount, getCurrentUserFromToken, issuePasswordResetToken, resetUserPassword, sendPasswordResetEmail } from '../lib/auth-server.js'

test('reset token changes password only once and invalidates existing sessions', async () => {
  const email = `${randomUUID()}@example.com`
  const { token: session } = await createUserAccount({ fullName: 'Test User', email, password: 'old-password' })
  const reset = await issuePasswordResetToken(email)
  assert.match(reset, /^[a-f0-9]{64}$/)
  assert.equal(await issuePasswordResetToken(email), null)
  await assert.rejects(resetUserPassword({ token: reset, password: 'short' }), /Password must/)
  await resetUserPassword({ token: reset, password: 'new-password' })
  await assert.rejects(resetUserPassword({ token: reset, password: 'another-password' }), /Invalid or expired/)
  await assert.rejects(authenticateUser({ email, password: 'old-password' }), /Invalid email or password/)
  await assert.rejects(getCurrentUserFromToken(session), /User not found/)
  const updated = await authenticateUser({ email, password: 'new-password' })
  assert.equal((await getCurrentUserFromToken(updated.token)).email, email)
})

test('unknown accounts and invalid tokens cannot be reset', async () => {
  assert.equal(await issuePasswordResetToken(`${randomUUID()}@example.com`), null)
  await assert.rejects(resetUserPassword({ token: 'bad-token', password: 'new-password' }), /Invalid or expired/)
  await assert.rejects(resetUserPassword({ token: 'a'.repeat(64), password: 'new-password' }), /Invalid or expired/)
})

test('expired reset tokens cannot change passwords', async () => {
  const email = `${randomUUID()}@example.com`
  await createUserAccount({ fullName: 'Test User', email, password: 'old-password' })
  const token = await issuePasswordResetToken(email)
  const user = globalThis.__knoukno_users__.find((item) => item.email === email)
  user.passwordReset.expiresAt = new Date(Date.now() - 1)
  await assert.rejects(resetUserPassword({ token, password: 'new-password' }), /Invalid or expired/)
  await authenticateUser({ email, password: 'old-password' })
})

test('missing email configuration is reported instead of returning a reset link', async () => {
  const previous = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  try {
    await assert.rejects(sendPasswordResetEmail({ email: 'unknown@example.com' }), /not configured/)
  } finally {
    if (previous !== undefined) process.env.RESEND_API_KEY = previous
  }
})