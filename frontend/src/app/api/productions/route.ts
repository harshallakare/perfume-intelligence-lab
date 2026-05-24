import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "pil-default";

function dbToApi(o: {
  id: string;
  orderNumber: string;
  formula: { name: string };
  status: string;
  requestedBottles: number;
  bottleSizeMl: number;
  plannedQtyMl: number;
  actualQtyMl: number | null;
  scheduledStart: Date | null;
  macerationEndsAt: Date | null;
  completedAt: Date | null;
  assignedTo: string | null;
  qcResult: string | null;
  notes: string | null;
  batchNumber: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    batch_number: o.batchNumber,
    formula_name: o.formula.name,
    status: o.status,
    requested_bottles: o.requestedBottles,
    bottle_size_ml: o.bottleSizeMl,
    planned_qty_ml: o.plannedQtyMl,
    actual_qty_ml: o.actualQtyMl,
    planned_start_date: o.scheduledStart ? o.scheduledStart.toISOString().split("T")[0] : null,
    maceration_ends_at: o.macerationEndsAt ? o.macerationEndsAt.toISOString().split("T")[0] : null,
    completed_at: o.completedAt ? o.completedAt.toISOString().split("T")[0] : null,
    assigned_to: o.assignedTo,
    qc_result: o.qcResult,
    notes: o.notes,
    created_at: o.createdAt.toISOString().split("T")[0],
    updated_at: o.updatedAt.toISOString().split("T")[0],
  };
}

export { dbToApi };

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json([], { status: 200 });

    const orders = await prisma.productionOrder.findMany({
      where: { organizationId: org.id },
      include: { formula: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders.map(dbToApi));
  } catch (err) {
    console.error("GET /api/productions:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const body = await req.json();

    // Auto-generate order number and batch number
    const count = await prisma.productionOrder.count({ where: { organizationId: org.id } });
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(3, "0");
    const orderNumber = `PIL-PO-${year}-${seq}`;
    const batchNumber = `BATCH-${year}-${seq}`;

    const requestedBottles = body.requested_bottles ?? 50;
    const bottleSizeMl = body.bottle_size_ml ?? 50;
    const plannedQtyMl = requestedBottles * bottleSizeMl;

    const order = await prisma.productionOrder.create({
      data: {
        organizationId: org.id,
        formulaId: body.formula_id,
        orderNumber,
        batchNumber,
        status: "draft",
        requestedBottles,
        bottleSizeMl,
        plannedQtyMl,
        scheduledStart: body.planned_start_date ? new Date(body.planned_start_date) : null,
        assignedTo: body.assigned_to ?? null,
        notes: body.notes ?? null,
      },
      include: { formula: { select: { name: true } } },
    });

    return NextResponse.json(dbToApi(order), { status: 201 });
  } catch (err) {
    console.error("POST /api/productions:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
