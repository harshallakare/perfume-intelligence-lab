import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_ID = "pil-default";

function dbToApi(f: {
  id: string;
  name: string;
  internalCode: string | null;
  concentrationType: string;
  status: string;
  olfactoryFamily: string | null;
  genderTarget: string | null;
  totalFragrancePct: number | null;
  costPerMl: number | null;
  version: number;
  isIfraCompliant: boolean | null;
  updatedAt: Date;
  _count: { ingredients: number };
}) {
  return {
    id: f.id,
    name: f.name,
    internal_code: f.internalCode,
    concentration_type: f.concentrationType,
    status: f.status,
    olfactory_family: f.olfactoryFamily,
    gender_target: f.genderTarget,
    total_fragrance_pct: f.totalFragrancePct,
    cost_per_ml: f.costPerMl,
    version: f.version,
    is_ifra_compliant: f.isIfraCompliant,
    ingredient_count: f._count.ingredients,
    updated_at: f.updatedAt.toISOString().split("T")[0],
  };
}

export { dbToApi };

export async function GET() {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json([], { status: 200 });

    const formulas = await prisma.formula.findMany({
      where: { organizationId: org.id },
      include: { _count: { select: { ingredients: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(formulas.map(dbToApi));
  } catch (err) {
    console.error("GET /api/formulas:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_ID } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const body = await req.json();

    const formula = await prisma.formula.create({
      data: {
        organizationId: org.id,
        name: body.name,
        internalCode: body.internal_code ?? null,
        concentrationType: body.concentration_type ?? "edp",
        status: body.status ?? "draft",
        olfactoryFamily: body.olfactory_family ?? null,
        genderTarget: body.gender_target ?? null,
        totalFragrancePct: body.total_fragrance_pct ?? null,
        costPerMl: body.cost_per_ml ?? null,
        version: 1,
        isIfraCompliant: body.is_ifra_compliant ?? null,
        description: body.description ?? null,
        perfumerNotes: body.perfumer_notes ?? null,
      },
      include: { _count: { select: { ingredients: true } } },
    });

    return NextResponse.json(dbToApi(formula), { status: 201 });
  } catch (err) {
    console.error("POST /api/formulas:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
