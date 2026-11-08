import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import { Resend } from 'resend'

const DEFAULT_JWT_SECRET = 'knoukno-dev-secret'
const MEMORY_USERS_KEY = '__knoukno_users__'

const memoryUsers = globalThis[MEMORY_USERS_KEY] || (globalThis[MEMORY_USERS_KEY] = [])

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase()
}

function buildUserRecord({ fullName, email, passwordHash }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`,
    fullName: String(fullName).trim(),
    email: normalizeEmail(email),
    passwordHash,
    createdAt: new Date().toISOString(),
  }
}

function sanitizeUser(user) {
  if (!user) return null
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
  }
}

async function getUsersCollection() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    return null
  }

  try {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db()
    return { client, collection: db.collection('users') }
  } catch {
    return null
  }
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  const dbData = await getUsersCollection()

  if (dbData) {
    const user = await dbData.collection.findOne({ email: normalizedEmail })
    await dbData.client.close()
    return user
  }

  return memoryUsers.find((user) => normalizeEmail(user.email) === normalizedEmail) || null
}

async function storeUser(user) {
  const dbData = await getUsersCollection()

  if (dbData) {
    await dbData.collection.insertOne(user)
    await dbData.client.close()
    return user
  }

  memoryUsers.push(user)
  return user
}

export async function createUserAccount({ fullName, email, password }) {
  const normalizedEmail = normalizeEmail(email)

  if (!String(fullName || '').trim()) {
    throw new Error('Please enter your full name.')
  }

  if (!normalizedEmail || !String(password || '').trim()) {
    throw new Error('Please complete all fields.')
  }

  const existingUser = await findUserByEmail(normalizedEmail)
  if (existingUser) {
    throw new Error('An account with that email already exists.')
  }

  const passwordHash = await bcrypt.hash(String(password), 10)
  const user = buildUserRecord({ fullName, email: normalizedEmail, passwordHash })
  await storeUser(user)

  const token = jwt.sign({ id: user.id, email: user.email, fullName: user.fullName }, process.env.JWT_SECRET || DEFAULT_JWT_SECRET, {
    expiresIn: '7d',
  })

  return {
    user: sanitizeUser(user),
    token,
  }
}

export async function authenticateUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const user = await findUserByEmail(normalizedEmail)

  if (!user) {
    throw new Error('Invalid email or password.')
  }

  const isValid = await bcrypt.compare(String(password), user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid email or password.')
  }

  const token = jwt.sign({ id: user.id, email: user.email, fullName: user.fullName }, process.env.JWT_SECRET || DEFAULT_JWT_SECRET, {
    expiresIn: '7d',
  })

  return {
    user: sanitizeUser(user),
    token,
  }
}

export function verifyToken(token) {
  if (!token) {
    throw new Error('Missing auth token.')
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || DEFAULT_JWT_SECRET)
  return decoded
}

export async function getCurrentUserFromToken(token) {
  const decoded = verifyToken(token)
  const user = await findUserByEmail(decoded.email)

  if (!user) {
    throw new Error('User not found.')
  }

  return sanitizeUser(user)
}

export async function sendPasswordResetEmail({ email }) {
  const normalizedEmail = normalizeEmail(email)
  const user = await findUserByEmail(normalizedEmail)

  if (!user) {
    return {
      sent: true,
      message: 'If an account exists, a reset link has been sent.',
    }
  }

  const resetToken = jwt.sign(
    { id: user.id, email: user.email, type: 'password-reset' },
    process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
    { expiresIn: '1h' },
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`

  if (!process.env.RESEND_API_KEY) {
    return {
      sent: true,
      message: 'If an account exists, a reset link has been sent.',
      resetUrl,
    }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: process.env.RESEND_FROM || 'noreply@knoukno.co',
    to: [normalizedEmail],
    subject: 'Reset your KNO U KNO password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
    text: `Reset your password: ${resetUrl}`,
  })

  return {
    sent: true,
    message: 'If an account exists, a reset link has been sent.',
    resetUrl,
  }
}
