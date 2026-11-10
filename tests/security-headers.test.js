import assert from 'node:assert/strict'
import test from 'node:test'
import nextConfig from '../next.config.mjs'

test('HSTS applies to all routes for one day without subdomains or preload', async () => {
  const rules = await nextConfig.headers()
  const rule = rules.find((item) => item.source === '/:path*')
  assert.ok(rule)
  assert.equal(rule.headers.find((header) => header.key === 'Strict-Transport-Security')?.value, 'max-age=86400')
})

test('security headers apply to all routes without exposing the framework', async () => {
  const rules = await nextConfig.headers()
  const rule = rules.find((item) => item.source === '/:path*')
  assert.ok(rule)
  const headers = Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]))
  assert.equal(nextConfig.poweredByHeader, false)
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(headers['X-Frame-Options'], 'DENY')
  const directives = headers['Content-Security-Policy'].split('; ')
  assert.ok(directives.includes("default-src 'self'"))
  assert.ok(directives.includes("object-src 'none'"))
  assert.ok(directives.includes("frame-ancestors 'none'"))
  assert.ok(directives.includes("form-action 'self'"))
  assert.ok(directives.includes("img-src 'self' data: blob: https://images.unsplash.com https://isitdown.now"))
  if (process.env.NODE_ENV !== 'development') {
    assert.ok(!headers['Content-Security-Policy'].includes("'unsafe-eval'"))
  }
})
