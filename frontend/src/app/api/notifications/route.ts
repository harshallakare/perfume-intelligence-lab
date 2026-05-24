import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "pil-default";

function dbToApi(n: {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  severity: string;
  createdAt: Date;
}) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    is_read: n.isRead,
    severity: n.severity,
    created_at: n.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json([], { status: 200 });

    const notifications = await prisma.notification.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications.map(dbToApi));
  } catch (err) {
    console.error("GET /api/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const body = await req.json();

    const notif = await prisma.notification.create({
      data: {
        organizationId: org.id,
        type: body.type ?? "system",
        title: body.title,
        message: body.message,
        link: body.link ?? null,
        severity: body.severity ?? "info",
      },
    });

    return NextResponse.json(dbToApi(notif), { status: 201 });
  } catch (err) {
    console.error("POST /api/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const body = await req.json();

    if (body.mark_all_read) {
      await prisma.notification.updateMany({
        where: { organizationId: org.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ ok: true, updated: "all" });
    }

    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
      return NextResponse.json({ ok: true, updated: body.id });
    }

    return NextResponse.json({ error: "Provide id or mark_all_read" }, { status: 400 });
  } catch (err) {
    console.error("PATCH /api/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
