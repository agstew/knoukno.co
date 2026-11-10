import { sendPasswordResetEmail } from '../../../../lib/auth-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email : ''

    if (!email.trim()) {
      return Response.json({ error: 'Please enter your email address.' }, { status: 400 })
    }

    const result = await sendPasswordResetEmail({ email })
    return Response.json({ message: result.message })
  } catch (error) {
    console.error('Password reset request failed:', error)
    return Response.json({ error: 'Unable to send reset email. Please try again later.' }, { status: 503 })
  }
}
