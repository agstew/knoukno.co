import { NextResponse } from 'next/server'
import { authenticateUser } from '../../../../lib/auth-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const result = await authenticateUser({
      email: body.email,
      password: body.password,
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Login failed.' }, { status: 400 })
  }
}
