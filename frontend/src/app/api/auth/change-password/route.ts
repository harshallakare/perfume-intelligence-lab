import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, hashPassword } from '@/lib/password'

export async function POST(req: NextRequest) {
  try {
    // Verify session
    const token = req.cookies.get('pil_session')?.value
    if (!token) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const session = await prisma.userSession.findUnique({ where: { token } })
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
    }

    // Fetch credential
    const cred = await prisma.userCredential.findUnique({ where: { email: session.email } })
    if (!cred) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Verify current password
    if (!verifyPassword(currentPassword, cred.passwordHash)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash and save new password
    await prisma.userCredential.update({
      where: { email: session.email },
      data:  { passwordHash: hashPassword(newPassword) },
    })

    return NextResponse.json({ ok: true, message: 'Password updated successfully' })

  } catch (err) {
    console.error('POST /api/auth/change-password:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
