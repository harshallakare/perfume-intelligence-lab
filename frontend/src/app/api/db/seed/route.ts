import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import path from 'node:path'

export async function POST() {
  try {
    const cwd = path.join(process.cwd())
    const output = execSync('npx tsx prisma/seed.ts', {
      cwd,
      timeout: 60_000,
      encoding: 'utf-8',
    })
    return NextResponse.json({
      ok: true,
      message: 'Database seeded with demo data',
      output: output.trim(),
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      message: 'Seeding failed',
      output: err.stderr ?? err.message,
    }, { status: 200 })
  }
}
