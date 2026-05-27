import { NextRequest, NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validate SQLite magic bytes: first 16 bytes must be "SQLite format 3\000"
    const magic = buffer.slice(0, 15).toString('utf8')
    if (!magic.startsWith('SQLite format 3')) {
      return NextResponse.json(
        { error: 'Invalid file — not a SQLite database. Please upload a valid .db backup file.' },
        { status: 400 }
      )
    }

    const dbPath = path.join(process.cwd(), 'prisma', 'pil.db')

    // Auto-backup current DB before replacing
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.pre-restore-${Date.now()}.bak`
      fs.copyFileSync(dbPath, backupPath)
    }

    // Write the restored DB
    fs.writeFileSync(dbPath, buffer)

    const sizeKb = (buffer.length / 1024).toFixed(1)
    return NextResponse.json({
      ok:      true,
      message: `Database restored from "${file.name}" (${sizeKb} KB). Previous database was auto-backed up on the server.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
