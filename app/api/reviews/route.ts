import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createReviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

// POST /api/reviews — Create a review
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingId, rating, comment } = parsed.data;

    // Verify booking validity:
    // 1. Belongs to user
    // 2. Is COMPLETED
    // 3. User hasn't already reviewed it
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Can only review completed bookings" },
        { status: 400 }
      );
    }

    if (booking.review) {
      return NextResponse.json(
        { error: "You have already reviewed this booking" },
        { status: 400 }
      );
    }

    // Create review in transaction to update business average rating
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create review
      const review = await tx.review.create({
        data: {
          bookingId,
          userId: session.user.id,
          businessId: booking.businessId,
          rating,
          comment,
        },
      });

      // 2. Recalculate business average rating
      const aggregations = await tx.review.aggregate({
        where: { businessId: booking.businessId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const newAvg = aggregations._avg.rating || 0;

      // 3. Update business
      await tx.business.update({
        where: { id: booking.businessId },
        data: { avgRating: newAvg },
      });

      return review;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("CREATE_REVIEW_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
