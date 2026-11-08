import { NextResponse } from 'next/server'
import { createUserAccount } from '../../../../lib/auth-server'

export async function POST(request) {
  try {
    const body = await request.json()
    const result = await createUserAccount({
      fullName: body.fullName,
      email: body.email,
      password: body.password,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Registration failed.' }, { status: 400 })
  }
}
