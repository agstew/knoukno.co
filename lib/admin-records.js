import { authorizeSiteAdmin } from './site-admin.js'

export const recordCategories = [
  ['payment', 'Payment'], ['title', 'Title'], ['login', 'Login'], ['register', 'Register'],
  ['print', 'Print'], ['save', 'Save'], ['question', 'Question'], ['grade', 'Grade'],
  ['rated', 'Rated'], ['answers', 'Answers'], ['average', 'Average'], ['delete', 'Delete'], ['email', 'Email'],
]

export async function handleAdminRecords(request, { authenticate, loadRecords, env = process.env }) {
  const headers = { 'Cache-Control': 'no-store' }
  try {
    const access = await authorizeSiteAdmin(request, authenticate, env)
    if (access.error) return Response.json({ error: access.error }, { status: access.status, headers })
    const category = new URL(request.url).searchParams.get('category')
    if (!recordCategories.some(([key]) => key === category)) {
      return Response.json({ error: 'Select a valid record category.' }, { status: 400, headers })
    }
    return Response.json(await loadRecords(category), { headers })
  } catch (error) {
    console.error('Admin record request failed:', error)
    return Response.json({ error: 'Unable to load records. Please try again.' }, { status: 500, headers })
  }
}
