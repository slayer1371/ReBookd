import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/business/nearby — List businesses near a location
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius");
    const category = searchParams.get("category");

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "lat and lng are required" },
        { status: 400 }
      );
    }

    const userLat = parseFloat(latStr);
    const userLng = parseFloat(lngStr);
    const radiusKm = radiusStr ? parseFloat(radiusStr) : 50;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (category) where.category = category;

    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        address: true,
        city: true,
        state: true,
        lat: true,
        lng: true,
        phone: true,
        avgRating: true,
        logoUrl: true,
        coverUrl: true,
        description: true,
        _count: {
          select: {
            cancellations: {
              where: {
                status: "AVAILABLE",
                expiresAt: { gt: new Date() },
              },
            },
            reviews: true,
            watchers: true,
            services: true,
          },
        },
      },
    });

    // Filter by distance and enrich
    const nearby = businesses
      .map((b) => ({
        ...b,
        distance: Math.round(haversineKm(userLat, userLng, b.lat, b.lng) * 10) / 10,
      }))
      .filter((b) => b.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ items: nearby });
  } catch (error) {
    console.error("NEARBY_BUSINESSES_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
