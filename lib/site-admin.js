const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function authorizeSiteAdmin(request, authenticate, env = process.env) {
  const user = await authenticate(request)
  if (!user) return { error: 'Please sign in again.', status: 401 }
  if (!env.ADMIN_USER_ID || !UUID_V4.test(env.ADMIN_USER_ID) ||
      !env.JWT_SECRET || env.JWT_SECRET === 'knoukno-dev-secret') {
    return { error: 'Site administration has not been configured.', status: 503 }
  }
  if (user.id !== env.ADMIN_USER_ID) return { error: 'You do not have site administrator access.', status: 403 }
  return { user }
}

export async function handleSiteAdmin(request, { authenticate, loadOverview, env = process.env }) {
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const access = await authorizeSiteAdmin(request, authenticate, env)
    if (access.error) return Response.json({ error: access.error }, { status: access.status, headers })

    const counts = await loadOverview()
    return Response.json({
      counts,
      configuration: {
        paypal: ['PAYPAL_LIVE_CLIENT_ID', 'PAYPAL_LIVE_CLIENT_SECRET', 'PAYPAL_LIVE_MEMBER_PLAN_ID', 'PAYPAL_LIVE_PRO_PLAN_ID', 'PAYPAL_LIVE_WEBHOOK_ID'].every((key) => Boolean(env[key])),
        resend: ['RESEND_API_KEY', 'RESEND_FROM', 'NEXT_PUBLIC_APP_URL'].every((key) => Boolean(env[key])),
        ai: ['OPENAI_API_KEY', 'OPENAI_MODEL'].every((key) => Boolean(env[key])),
      },
    }, { headers })
  } catch (error) {
    console.error('Site administration request failed:', error)
    return Response.json({ error: 'Unable to load site administration. Please try again.' }, { status: 500, headers })
  }
}
