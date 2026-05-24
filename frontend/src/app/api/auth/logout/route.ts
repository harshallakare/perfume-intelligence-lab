import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("pil_session")?.value;
    if (token) {
      await prisma.userSession.deleteMany({ where: { token } });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.delete("pil_session");
    return res;
  } catch (err) {
    console.error("POST /api/auth/logout:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
