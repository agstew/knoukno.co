const SESSION_KEY = 'knoukno_session'

export function authDestination(search) {
  return new URLSearchParams(search).get('next') === 'trial' ? '/trial' : '/admin'
}

export function authLink(path, search) {
  if (!['/login', '/register'].includes(path)) throw new Error('Invalid authentication page.')
  return authDestination(search) === '/trial' ? `${path}?next=trial` : path
}

function safeRead(key, fallback = null) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage failures in restricted browsers
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || 'Something went wrong.')
  }

  return payload
}

export function getSession() {
  return safeRead(SESSION_KEY, null)
}

export function saveSession(session) {
  safeWrite(SESSION_KEY, session)
}

export function clearSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SESSION_KEY)
}

export async function registerUser({ fullName, email, password }) {
  const result = await requestJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  })

  const session = {
    token: result.token,
    user: result.user,
  }

  saveSession(session)
  return result.user
}

export async function loginUser({ email, password }) {
  const result = await requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  const session = {
    token: result.token,
    user: result.user,
  }

  saveSession(session)
  return result.user
}

export async function fetchCurrentUser() {
  const session = getSession()
  if (!session?.token) {
    return null
  }

  const payload = await requestJson('/api/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  })

  return payload.user
}
