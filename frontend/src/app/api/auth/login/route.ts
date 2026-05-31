import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/password'

function randomToken() {
  const bytes = new Uint8Array(32)
  globalThis.crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Look up credential in DB
    const cred = await prisma.userCredential.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!cred || !verifyPassword(password, cred.passwordHash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Purge old sessions and create new one
    await prisma.userSession.deleteMany({ where: { email: email.toLowerCase() } })

    const token     = randomToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await prisma.userSession.create({
      data: { token, email: cred.email, name: cred.name, role: cred.role, expiresAt },
    })

    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' ||
      process.env.COOKIE_SECURE === 'true'

    const res = NextResponse.json({ ok: true, name: cred.name, role: cred.role, email: cred.email })
    res.cookies.set('pil_session', token, {
      httpOnly: true, sameSite: 'lax', path: '/', expires: expiresAt, secure: isHttps,
    })
    return res

  } catch (err) {
    console.error('POST /api/auth/login:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
