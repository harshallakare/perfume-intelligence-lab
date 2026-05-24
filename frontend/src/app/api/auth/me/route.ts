import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("pil_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const session = await prisma.userSession.findUnique({ where: { token } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.userSession.delete({ where: { token } });
      const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
      res.cookies.delete("pil_session");
      return res;
    }

    return NextResponse.json({
      email: session.email,
      name: session.name,
      role: session.role,
    });
  } catch (err) {
    console.error("GET /api/auth/me:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
