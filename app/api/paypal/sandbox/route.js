import { getCurrentUserFromToken } from '../../../../lib/auth-server'
import { createSandboxSubscription, getSandboxSubscription, sandboxConfig, SandboxError } from '../../../../lib/paypal-sandbox'

export async function POST(request) {
  try {
    sandboxConfig()
  } catch (error) {
    return Response.json({ error: error.message }, { status: 503 })
  }

  const authorization = request.headers.get('authorization') || ''
  if (!/^Bearer\s+\S+$/i.test(authorization)) {
    return Response.json({ error: 'Please sign in first.' }, { status: 401 })
  }

  try {
    let user
    try {
      user = await getCurrentUserFromToken(authorization.replace(/^Bearer\s+/i, ''))
    } catch (error) {
      if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name) || error.message === 'User not found.') {
        return Response.json({ error: 'Please sign in again.' }, { status: 401 })
      }
      throw error
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      if (error instanceof SyntaxError) return Response.json({ error: 'Invalid request.' }, { status: 400 })
      throw error
    }
    if (body?.action === 'create') {
      return Response.json(await createSandboxSubscription({ name: body.plan, userId: user.id }))
    }
    if (body?.action === 'status') {
      return Response.json(await getSandboxSubscription({ subscriptionId: body.subscriptionId, userId: user.id }))
    }
    return Response.json({ error: 'Invalid checkout action.' }, { status: 400 })
  } catch (error) {
    console.error('PayPal Sandbox checkout failed:', error.message)
    if (error instanceof SandboxError) return Response.json({ error: error.message }, { status: 400 })
    return Response.json({ error: 'Unable to complete the Sandbox checkout. Please try again.' }, { status: 500 })
  }
}
