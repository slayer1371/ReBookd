import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCancellationSchema } from "@/lib/validations";
import {
  calculateDiscount,
  calculateDiscountedPrice,
} from "@/lib/discount";
import { notifyMatchingUsers } from "@/lib/matcher";

// POST /api/cancellations — Post a new cancellation (business only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the user's business
    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (!business) {
      return NextResponse.json(
        { error: "No business found. Please complete onboarding first." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createCancellationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error },
        { status: 400 }
      );
    }

    // Verify service belongs to this business
    const service = await prisma.service.findFirst({
      where: { id: parsed.data.serviceId, businessId: business.id },
    });
    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Calculate dynamic discount
    const discountPercent = calculateDiscount(
      parsed.data.originalStartTime,
      parsed.data.minDiscount,
      parsed.data.maxDiscount
    );
    const discountedPrice = calculateDiscountedPrice(
      Number(service.originalPrice),
      discountPercent
    );

    const cancellation = await prisma.cancellation.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        originalStartTime: parsed.data.originalStartTime,
        originalEndTime: parsed.data.originalEndTime,
        discountPercent,
        discountedPrice,
        minDiscount: parsed.data.minDiscount,
        maxDiscount: parsed.data.maxDiscount,
        expiresAt: parsed.data.originalStartTime,
      },
      include: {
        service: true,
        business: { select: { name: true, slug: true, category: true, lat: true, lng: true } },
      },
    });

    // Fire-and-forget: notify matching users
    notifyMatchingUsers({
      id: cancellation.id,
      businessId: cancellation.businessId,
      discountPercent: cancellation.discountPercent,
      discountedPrice: Number(cancellation.discountedPrice),
      originalStartTime: cancellation.originalStartTime,
      service: {
        name: cancellation.service.name,
        category: cancellation.service.category,
        originalPrice: cancellation.service.originalPrice.toString(),
      },
      business: cancellation.business as { name: string; slug: string; category: string; lat: number; lng: number },
    });

    return NextResponse.json(cancellation, { status: 201 });
  } catch (error) {
    console.error("CREATE_CANCELLATION_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Haversine distance in km
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

// GET /api/cancellations — Feed (query: lat, lng, radius, category, categories)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const categories = searchParams.get("categories"); // comma-separated
    const businessId = searchParams.get("businessId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");

    // Location params
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius"); // km
    const userLat = latStr ? parseFloat(latStr) : null;
    const userLng = lngStr ? parseFloat(lngStr) : null;
    const radiusKm = radiusStr ? parseFloat(radiusStr) : null;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: "AVAILABLE",
      expiresAt: { gt: new Date() },
    };

    // Single category filter (from category pills)
    if (category) {
      where.business = { category };
    }
    // Multi-category filter (from user preferences)
    else if (categories) {
      const catList = categories.split(",").filter(Boolean);
      if (catList.length > 0) {
        where.business = { category: { in: catList } };
      }
    }

    if (businessId) {
      where.businessId = businessId;
    }

    // When filtering by distance, fetch more to allow for post-filter
    const fetchLimit = radiusKm && userLat && userLng ? 200 : limit + 1;

    const cancellations = await prisma.cancellation.findMany({
      where,
      include: {
        service: true,
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            address: true,
            city: true,
            lat: true,
            lng: true,
            avgRating: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { originalStartTime: "asc" },
      take: fetchLimit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    // Recalculate discounts dynamically
    const now = new Date();
    let enriched = cancellations.map((c) => {
      const freshDiscount = calculateDiscount(
        c.originalStartTime,
        c.minDiscount,
        c.maxDiscount,
        now
      );
      const freshPrice = calculateDiscountedPrice(
        Number(c.service.originalPrice),
        freshDiscount
      );

      // Calculate distance if user location provided
      let distance: number | null = null;
      if (userLat != null && userLng != null && c.business.lat && c.business.lng) {
        distance = Math.round(haversineKm(userLat, userLng, c.business.lat, c.business.lng) * 10) / 10;
      }

      return {
        ...c,
        discountPercent: freshDiscount,
        discountedPrice: freshPrice,
        distance,
      };
    });

    // Filter by radius if specified
    if (radiusKm && userLat != null && userLng != null) {
      enriched = enriched.filter((c) => c.distance !== null && c.distance <= radiusKm);
      // Sort by distance
      enriched.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    }

    // Apply pagination limit after distance filtering
    const hasMore = enriched.length > limit;
    const items = hasMore ? enriched.slice(0, limit) : enriched;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("GET_CANCELLATIONS_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

