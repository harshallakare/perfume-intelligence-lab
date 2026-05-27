import { NextResponse } from 'next/server'
import path from 'node:path'
import fs from 'node:fs'

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'pil.db')

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(dbPath)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `pil_backup_${timestamp}.db`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      buffer.length.toString(),
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
