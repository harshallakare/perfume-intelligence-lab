import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ORG_SLUG = "pil-default";

function parseSettings(raw: string): Record<string, string> {
  try { return JSON.parse(raw) ?? {}; } catch { return {}; }
}

// GET /api/settings — returns org name + settings JSON
export async function GET() {
  try {
    const org = await prisma.organization.findFirst({ where: { slug: ORG_SLUG } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const settings = parseSettings(org.settings);

    return NextResponse.json({
      id:              org.id,
      name:            org.name,
      slug:            org.slug,
      currency:        settings.currency        ?? "USD",
      timezone:        settings.timezone        ?? "UTC",
      country:         settings.country         ?? "US",
      website:         settings.website         ?? "",
      address:         settings.address         ?? "",
      fiscal_year_start: settings.fiscalYearStart ?? "01",
    });
  } catch (err) {
    console.error("GET /api/settings:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/settings — update org name and/or settings fields
// Body: { name?, currency?, timezone?, country?, website?, address?, fiscal_year_start? }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const org = await prisma.organization.findFirst({ where: { slug: ORG_SLUG } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const current = parseSettings(org.settings);

    // Merge incoming fields into the settings JSON
    const merged: Record<string, string> = {
      ...current,
      ...(body.currency          !== undefined && { currency:         body.currency }),
      ...(body.timezone          !== undefined && { timezone:         body.timezone }),
      ...(body.country           !== undefined && { country:          body.country }),
      ...(body.website           !== undefined && { website:          body.website }),
      ...(body.address           !== undefined && { address:          body.address }),
      ...(body.fiscal_year_start !== undefined && { fiscalYearStart:  body.fiscal_year_start }),
    };

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        settings: JSON.stringify(merged),
      },
    });

    const settings = parseSettings(updated.settings);
    return NextResponse.json({
      id:              updated.id,
      name:            updated.name,
      slug:            updated.slug,
      currency:        settings.currency        ?? "USD",
      timezone:        settings.timezone        ?? "UTC",
      country:         settings.country         ?? "US",
      website:         settings.website         ?? "",
      address:         settings.address         ?? "",
      fiscal_year_start: settings.fiscalYearStart ?? "01",
    });
  } catch (err) {
    console.error("PATCH /api/settings:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
