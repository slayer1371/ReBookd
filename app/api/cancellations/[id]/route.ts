import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateDiscount, calculateDiscountedPrice } from "@/lib/discount";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cancellation = await prisma.cancellation.findUnique({
    where: { id },
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
          state: true,
          lat: true,
          lng: true,
          avgRating: true,
          phone: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!cancellation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Recalculate live discount
  const now = new Date();
  const discountPercent = calculateDiscount(
    cancellation.originalStartTime,
    cancellation.minDiscount,
    cancellation.maxDiscount,
    now
  );
  const discountedPrice = calculateDiscountedPrice(
    Number(cancellation.service.originalPrice),
    discountPercent
  );

  return NextResponse.json({
    ...cancellation,
    discountPercent,
    discountedPrice,
  });
}
