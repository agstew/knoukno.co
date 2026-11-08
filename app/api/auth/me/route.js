import { NextResponse } from 'next/server'
import { getCurrentUserFromToken } from '../../../../lib/auth-server'

export async function GET(request) {
  try {
    const authorization = request.headers.get('authorization') || ''
    const token = authorization.replace(/^Bearer\s+/i, '')
    const user = await getCurrentUserFromToken(token)

    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Authentication failed.' }, { status: 401 })
  }
}
