import test from 'node:test'
import assert from 'node:assert/strict'
import { businessNavigation, businessViewFromSearch, businessViewHref, publicNavigation } from '../lib/navigation.js'

test('public navigation points to the requested pages and pricing section', () => {
  assert.deepEqual(publicNavigation, [
    { label: 'Home', href: '/' },
    { label: 'Login', href: '/login' },
    { label: 'Register', href: '/register' },
    { label: 'Price', href: '/#price' },
  ])
})

test('business navigation safely routes each requested view', () => {
  assert.deepEqual(businessNavigation.map((item) => item.label), ['Title', 'Dashboard', 'Grade', 'Rated', 'Average'])
  for (const { view } of businessNavigation) {
    const href = businessViewHref(view)
    assert.equal(businessViewFromSearch(new URL(href, 'https://example.test').search), view)
  }
  assert.equal(businessViewFromSearch('?view=https://example.com'), 'titles')
  assert.throws(() => businessViewHref('https://example.com'), /Invalid business view/)
})
