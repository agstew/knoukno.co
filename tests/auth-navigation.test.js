import test from 'node:test'
import assert from 'node:assert/strict'
import { authDestination, authLink } from '../lib/auth-client.js'

test('authentication keeps trial destination while changing between sign-in and registration', () => {
  assert.equal(authDestination('?next=trial'), '/trial')
  assert.equal(authLink('/login', '?next=trial'), '/login?next=trial')
  assert.equal(authLink('/register', '?next=trial'), '/register?next=trial')
})

test('authentication accepts no arbitrary redirects', () => {
  for (const search of ['', '?next=https://example.com', '?next=/trial', '?next=admin']) {
    assert.equal(authDestination(search), '/admin')
    assert.equal(authLink('/login', search), '/login')
  }
  assert.throws(() => authLink('https://example.com', '?next=trial'), /Invalid authentication page/)
})
