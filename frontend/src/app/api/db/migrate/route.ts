import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'node:path'

export async function POST() {
  try {
    const cwd = path.join(process.cwd())
    // Run prisma migrate deploy (non-interactive, safe for production)
    const output = execSync('npx prisma migrate deploy', {
      cwd,
      timeout: 60_000,
      encoding: 'utf-8',
    })
    return NextResponse.json({
      ok: true,
      message: 'Migrations applied successfully',
      output: output.trim(),
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      message: 'Migration failed',
      output: err.stderr ?? err.message,
    }, { status: 200 })
  }
}
