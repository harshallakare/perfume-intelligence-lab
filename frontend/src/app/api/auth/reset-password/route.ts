import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, generateRecoveryCode } from '@/lib/password'

// POST /api/auth/reset-password
// body: { action: 'generate', email }           → admin generates a recovery code (requires session)
// body: { action: 'confirm', email, code, newPassword } → use code to reset (no session needed)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // ── Generate recovery code (must be logged in as admin) ──────────────────
    if (action === 'generate') {
      const token = req.cookies.get('pil_session')?.value
      if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

      const session = await prisma.userSession.findUnique({ where: { token } })
      if (!session || session.expiresAt < new Date() || session.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const { email } = body
      const cred = await prisma.userCredential.findUnique({ where: { email: email?.toLowerCase() } })
      if (!cred) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const code    = generateRecoveryCode()                   // plain code shown to user once
      const expiry  = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Store hashed version — same scrypt helper reused
      const { hashPassword: hp } = await import('@/lib/password')
      await prisma.userCredential.update({
        where: { email: cred.email },
        data:  { resetToken: hp(code), resetExpiry: expiry },
      })

      return NextResponse.json({ ok: true, code, expiresAt: expiry.toISOString() })
    }

    // ── Confirm reset (no auth needed — uses the code) ───────────────────────
    if (action === 'confirm') {
      const { email, code, newPassword } = body

      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const cred = await prisma.userCredential.findUnique({ where: { email: email.toLowerCase() } })
      if (!cred || !cred.resetToken || !cred.resetExpiry) {
        return NextResponse.json({ error: 'No active recovery code for this account' }, { status: 400 })
      }
      if (cred.resetExpiry < new Date()) {
        return NextResponse.json({ error: 'Recovery code has expired' }, { status: 400 })
      }

      const { verifyPassword } = await import('@/lib/password')
      if (!verifyPassword(code, cred.resetToken)) {
        return NextResponse.json({ error: 'Invalid recovery code' }, { status: 400 })
      }

      await prisma.userCredential.update({
        where: { email: cred.email },
        data:  { passwordHash: hashPassword(newPassword), resetToken: null, resetExpiry: null },
      })

      return NextResponse.json({ ok: true, message: 'Password reset successfully. You can now log in.' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (err) {
    console.error('POST /api/auth/reset-password:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
