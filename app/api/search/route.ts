import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BusinessCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ businesses: [], services: [] });
  }

  try {
    const searchTerm = q.trim();
    const upperTerm = searchTerm.toUpperCase();
    
    // Check if the search term matches a known category
    const isCategory = Object.keys(BusinessCategory).includes(upperTerm);

    const [businesses, services] = await Promise.all([
      prisma.business.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            // Only search by category if it's a valid enum value
            ...(isCategory ? [{ category: { equals: upperTerm as BusinessCategory } }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          logoUrl: true,
          city: true,
        },
        take: 5,
      }),
      prisma.service.findMany({
        where: {
          name: { contains: searchTerm, mode: "insensitive" },
        },
        include: {
          business: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        take: 5,
      }),
    ]);

    return NextResponse.json({ businesses, services });
  } catch (error) {
    console.error("SEARCH_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
