import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dbToApi } from "../route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const order = await prisma.productionOrder.findUnique({
      where: { id },
      include: {
        formula: { select: { name: true, id: true, concentrationType: true } },
      },
    });

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(dbToApi({ ...order, formula: { name: order.formula.name } }));
  } catch (err) {
    console.error("GET /api/productions/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.productionOrder.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const newStatus = body.status ?? existing.status;

    const updated = await prisma.productionOrder.update({
      where: { id },
      data: {
        status: newStatus,
        assignedTo: body.assigned_to !== undefined ? body.assigned_to : existing.assignedTo,
        scheduledStart: body.planned_start_date ? new Date(body.planned_start_date) : existing.scheduledStart,
        macerationEndsAt: body.maceration_ends_at ? new Date(body.maceration_ends_at) : existing.macerationEndsAt,
        actualQtyMl: body.actual_qty_ml !== undefined ? body.actual_qty_ml : existing.actualQtyMl,
        qcResult: body.qc_result !== undefined ? body.qc_result : existing.qcResult,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        completedAt: newStatus === "completed" && !existing.completedAt ? new Date() : existing.completedAt,
      },
      include: { formula: { select: { name: true } } },
    });

    return NextResponse.json(dbToApi({ ...updated, formula: { name: updated.formula.name } }));
  } catch (err) {
    console.error("PUT /api/productions/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await prisma.productionOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/productions/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
