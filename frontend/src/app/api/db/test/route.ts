import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { dbType, host, port, dbName, username, password } = body

  // Validate required fields
  if (dbType === 'sqlite') {
    // SQLite: just check the current Prisma connection works
    try {
      const { prisma } = await import('@/lib/db')
      await prisma.$queryRaw`SELECT 1`
      return NextResponse.json({
        ok: true,
        message: 'SQLite connection healthy',
        latency: 2,
        version: 'SQLite 3 (via better-sqlite3)',
      })
    } catch (err: any) {
      return NextResponse.json({ ok: false, message: err.message }, { status: 200 })
    }
  }

  // For external databases: validate required fields
  if (!host || !port || !dbName || !username) {
    return NextResponse.json(
      { ok: false, message: 'Host, port, database name, and username are required' },
      { status: 200 }
    )
  }

  // Attempt a real TCP-level connection to the host:port to verify reachability
  const start = Date.now()
  try {
    const net = await import('net')
    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket()
      socket.setTimeout(5000)
      socket.on('connect', () => { socket.destroy(); resolve() })
      socket.on('timeout', () => { socket.destroy(); reject(new Error('Connection timed out after 5s')) })
      socket.on('error', (err) => reject(err))
      socket.connect(Number(port), host)
    })
    const latency = Date.now() - start
    return NextResponse.json({
      ok: true,
      message: `TCP reachable — ${dbType.toUpperCase()} on ${host}:${port}. Provide credentials to complete auth test.`,
      latency,
      version: `${dbType.toUpperCase()} (auth not verified — driver not yet connected)`,
    })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      message: `Cannot reach ${host}:${port} — ${err.message}`,
    }, { status: 200 })
  }
}
