import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/formulas/:id/ingredients — list all ingredients for a formula
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;

    const ingredients = await prisma.formulaIngredient.findMany({
      where: { formulaId: id },
      include: {
        rawMaterial: {
          select: { id: true, name: true, casNumber: true, odorFamily: true, costPerUnit: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(
      ingredients.map((i) => ({
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
      }))
    );
  } catch (err) {
    console.error("GET /api/formulas/[id]/ingredients:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/formulas/:id/ingredients — add one ingredient to a formula
// Body: { raw_material_id, section?, percentage, sort_order?, perfumer_notes? }
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { id: formulaId } = await ctx.params;
    const body = await req.json();

    // Validate the formula exists
    const formula = await prisma.formula.findUnique({ where: { id: formulaId } });
    if (!formula) return NextResponse.json({ error: "Formula not found" }, { status: 404 });

    // Validate required fields
    if (!body.raw_material_id) {
      return NextResponse.json({ error: "raw_material_id is required" }, { status: 400 });
    }
    if (body.percentage == null) {
      return NextResponse.json({ error: "percentage is required" }, { status: 400 });
    }

    // Validate the raw material exists
    const material = await prisma.rawMaterial.findUnique({
      where: { id: body.raw_material_id },
    });
    if (!material) return NextResponse.json({ error: "Raw material not found" }, { status: 404 });

    // Determine next sort_order if not provided
    let sortOrder = body.sort_order;
    if (sortOrder == null) {
      const maxOrder = await prisma.formulaIngredient.aggregate({
        where: { formulaId },
        _max: { sortOrder: true },
      });
      sortOrder = (maxOrder._max.sortOrder ?? 0) + 1;
    }

    const ingredient = await prisma.formulaIngredient.create({
      data: {
        formulaId,
        rawMaterialId: body.raw_material_id,
        section: body.section ?? "middle_note",
        percentage: Number(body.percentage),
        sortOrder: Number(sortOrder),
        perfumerNotes: body.perfumer_notes ?? null,
      },
      include: {
        rawMaterial: {
          select: { id: true, name: true, casNumber: true, odorFamily: true, costPerUnit: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: ingredient.id,
        raw_material_id: ingredient.rawMaterialId,
        name: ingredient.rawMaterial.name,
        cas_number: ingredient.rawMaterial.casNumber,
        odor_family: ingredient.rawMaterial.odorFamily,
        cost_per_unit: ingredient.rawMaterial.costPerUnit,
        section: ingredient.section,
        percentage: ingredient.percentage,
        sort_order: ingredient.sortOrder,
        perfumer_notes: ingredient.perfumerNotes,
      },
      { status: 201 }
    );
  } catch (err: any) {
    // Unique constraint violation — material already in formula
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "This material is already in the formula" }, { status: 409 });
    }
    console.error("POST /api/formulas/[id]/ingredients:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/formulas/:id/ingredients — remove all ingredients (used when rebuilding)
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  try {
    const { id: formulaId } = await ctx.params;
    await prisma.formulaIngredient.deleteMany({ where: { formulaId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/formulas/[id]/ingredients:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
