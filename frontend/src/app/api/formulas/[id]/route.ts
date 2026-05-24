import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dbToApi } from "../route";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const formula = await prisma.formula.findUnique({
      where: { id },
      include: {
        _count: { select: { ingredients: true } },
        ingredients: {
          include: { rawMaterial: { select: { id: true, name: true, casNumber: true, odorFamily: true, costPerUnit: true } } },
          orderBy: { sortOrder: "asc" },
        },
        versions: { orderBy: { versionNum: "desc" }, take: 10 },
      },
    });

    if (!formula) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...dbToApi({ ...formula, _count: { ingredients: formula._count.ingredients } }),
      ingredients: formula.ingredients.map((i) => ({
        id: i.id,
        raw_material_id: i.rawMaterialId,
        name: i.rawMaterial.name,
        cas_number: i.rawMaterial.casNumber,
        odor_family: i.rawMaterial.odorFamily,
        cost_per_unit: i.rawMaterial.costPerUnit,
        section: i.section,
        percentage: i.percentage,
        sort_order: i.sortOrder,
        perfumer_notes: i.perfumerNotes,
      })),
      versions: formula.versions.map((v) => ({
        id: v.id,
        version_num: v.versionNum,
        change_note: v.changeNote,
        created_at: v.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET /api/formulas/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json();

    // Snapshot before update for version history
    const existing = await prisma.formula.findUnique({
      where: { id },
      include: { ingredients: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.formula.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        internalCode: body.internal_code !== undefined ? body.internal_code : existing.internalCode,
        concentrationType: body.concentration_type ?? existing.concentrationType,
        status: body.status ?? existing.status,
        olfactoryFamily: body.olfactory_family !== undefined ? body.olfactory_family : existing.olfactoryFamily,
        genderTarget: body.gender_target !== undefined ? body.gender_target : existing.genderTarget,
        totalFragrancePct: body.total_fragrance_pct !== undefined ? body.total_fragrance_pct : existing.totalFragrancePct,
        costPerMl: body.cost_per_ml !== undefined ? body.cost_per_ml : existing.costPerMl,
        version: { increment: 1 },
        isIfraCompliant: body.is_ifra_compliant !== undefined ? body.is_ifra_compliant : existing.isIfraCompliant,
        description: body.description !== undefined ? body.description : existing.description,
        perfumerNotes: body.perfumer_notes !== undefined ? body.perfumer_notes : existing.perfumerNotes,
        lockedAt: body.status === "locked" ? new Date() : existing.lockedAt,
      },
      include: { _count: { select: { ingredients: true } } },
    });

    // Save version snapshot
    await prisma.formulaVersion.create({
      data: {
        formulaId: id,
        versionNum: updated.version,
        snapshot: JSON.stringify({ ...existing, ingredients: existing.ingredients }),
        changeNote: body.change_note ?? null,
      },
    });

    return NextResponse.json(dbToApi(updated));
  } catch (err) {
    console.error("PUT /api/formulas/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    await prisma.formula.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/formulas/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
