import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function randomToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Demo credentials — in production, hash passwords with bcrypt
const DEMO_USERS: Record<string, { password: string; name: string; role: string }> = {
  "admin@pil.com":  { password: "admin123",  name: "Admin User",      role: "admin"  },
  "perfumer@pil.com": { password: "perfumer123", name: "Master Perfumer", role: "perfumer" },
  "viewer@pil.com": { password: "viewer123", name: "Viewer",           role: "viewer" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const user = DEMO_USERS[email?.toLowerCase()];
    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Purge old sessions for this email
    await prisma.userSession.deleteMany({ where: { email: email.toLowerCase() } });

    // Create new session
    const token = randomToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.userSession.create({
      data: {
        token,
        email: email.toLowerCase(),
        name: user.name,
        role: user.role,
        expiresAt,
      },
    });

    const res = NextResponse.json({ ok: true, name: user.name, role: user.role, email: email.toLowerCase() });
    res.cookies.set("pil_session", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    console.error("POST /api/auth/login:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
