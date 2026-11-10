import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'
import { Resend } from 'resend'
import { createHash, randomBytes, randomUUID } from 'node:crypto'

const DEFAULT_JWT_SECRET = 'knoukno-dev-secret'
const MEMORY_USERS_KEY = '__knoukno_users__'

const memoryUsers = globalThis[MEMORY_USERS_KEY] || (globalThis[MEMORY_USERS_KEY] = [])

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase()
}

function buildUserRecord({ fullName, email, passwordHash }) {
  return {
    id: randomUUID(),
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
    if (process.env.NODE_ENV === 'production') throw new Error('MONGODB_URI is required in production.')
    return null
  }

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db()
  return { client, collection: db.collection('users') }
}

async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  const dbData = await getUsersCollection()

  if (dbData) {
    try {
      return await dbData.collection.findOne({ email: normalizedEmail })
    } finally {
      await dbData.client.close()
    }
  }

  return memoryUsers.find((user) => normalizeEmail(user.email) === normalizedEmail) || null
}

async function storeUser(user) {
  const dbData = await getUsersCollection()

  if (dbData) {
    try {
      await dbData.collection.insertOne(user)
    } finally {
      await dbData.client.close()
    }
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

  const token = jwt.sign({ id: user.id, email: user.email, fullName: user.fullName, authVersion: user.authVersion || 0 }, process.env.JWT_SECRET || DEFAULT_JWT_SECRET, {
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

  const token = jwt.sign({ id: user.id, email: user.email, fullName: user.fullName, authVersion: user.authVersion || 0 }, process.env.JWT_SECRET || DEFAULT_JWT_SECRET, {
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

  if (!user || decoded.type || decoded.id !== user.id || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
    throw new Error('User not found.')
  }

  return sanitizeUser(user)
}

const hashResetToken = (token) => createHash('sha256').update(token).digest('hex')

export async function issuePasswordResetToken(email) {
  const normalizedEmail = normalizeEmail(email)
  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const reset = { hash: hashResetToken(token), expiresAt: new Date(now.getTime() + 60 * 60 * 1000), requestedAt: now }
  const dbData = await getUsersCollection()
  if (dbData) {
    try {
      const result = await dbData.collection.updateOne(
        { email: normalizedEmail, $or: [{ 'passwordReset.requestedAt': { $exists: false } }, { 'passwordReset.requestedAt': { $lte: new Date(now.getTime() - 60000) } }] },
        { $set: { passwordReset: reset } },
      )
      return result.modifiedCount ? token : null
    } finally {
      await dbData.client.close()
    }
  }
  const user = memoryUsers.find((item) => item.email === normalizedEmail)
  if (!user || (user.passwordReset && now - user.passwordReset.requestedAt < 60000)) return null
  user.passwordReset = reset
  return token
}

export async function resetUserPassword({ token, password }) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid or expired reset link.')
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password must be at least 6 characters and at most 72 UTF-8 bytes.')
  const hash = hashResetToken(token)
  const passwordHash = await bcrypt.hash(password, 10)
  const authVersion = randomUUID()
  const dbData = await getUsersCollection()
  if (dbData) {
    try {
      const result = await dbData.collection.updateOne(
        { 'passwordReset.hash': hash, 'passwordReset.expiresAt': { $gt: new Date() } },
        { $set: { passwordHash, authVersion }, $unset: { passwordReset: '' } },
      )
      if (!result.modifiedCount) throw new Error('Invalid or expired reset link.')
    } finally {
      await dbData.client.close()
    }
    return
  }
  const user = memoryUsers.find((item) => item.passwordReset?.hash === hash && item.passwordReset.expiresAt > new Date())
  if (!user) throw new Error('Invalid or expired reset link.')
  user.passwordHash = passwordHash
  user.authVersion = authVersion
  delete user.passwordReset
}

export async function sendPasswordResetEmail({ email }) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM || !process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('Password reset email is not configured.')
  }
  const token = await issuePasswordResetToken(email)
  if (token) {
    const resetUrl = new URL('/reset-password', process.env.NEXT_PUBLIC_APP_URL)
    resetUrl.searchParams.set('token', token)
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: [normalizeEmail(email)],
      subject: 'Reset your Kno U Kno password',
      text: `Reset your password using this link, which expires in one hour: ${resetUrl}`,
    })
    if (error) {
      console.error('Password reset email failed:', error.message)
      throw new Error('Unable to send reset email.')
    }
  }
  return { message: 'If an account exists, a reset link has been sent.' }
}
