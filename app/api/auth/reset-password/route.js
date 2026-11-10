import { resetUserPassword } from '../../../../lib/auth-server'

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }
  try {
    await resetUserPassword({ token: body?.token, password: body?.password })
    return Response.json({ message: 'Password updated. Please log in.' })
  } catch (error) {
    if (error.message === 'Invalid or expired reset link.' || error.message.startsWith('Password must be')) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error('Password reset failed:', error)
    return Response.json({ error: 'Unable to reset password. Please try again later.' }, { status: 500 })
  }
}