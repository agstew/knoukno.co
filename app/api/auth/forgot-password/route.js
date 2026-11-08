import { sendPasswordResetEmail } from '../../../../lib/auth-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email : ''

    if (!email.trim()) {
      return Response.json({ error: 'Please enter your email address.' }, { status: 400 })
    }

    const result = await sendPasswordResetEmail({ email })
    return Response.json({
      message: result.message,
      resetUrl: result.resetUrl || null,
    })
  } catch (error) {
    return Response.json({ error: error.message || 'Unable to send reset email.' }, { status: 500 })
  }
}
