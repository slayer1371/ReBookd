import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBusinessSchema } from "@/lib/validations";

// POST /api/business — Create a new business
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already owns a business
    const existing = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a business registered" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = createBusinessSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const slugExists = await prisma.business.findUnique({
      where: { slug: parsed.data.slug },
    });
    if (slugExists) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 400 }
      );
    }

    // Create business and update user role
    const business = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.user.id },
        data: { role: "BUSINESS" },
      });

      return tx.business.create({
        data: {
          ...parsed.data,
          ownerId: session.user.id,
        },
      });
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error("CREATE_BUSINESS_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/business — Get current user's business
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      include: {
        services: true,
        _count: {
          select: {
            cancellations: true,
            bookings: true,
            reviews: true,
            watchers: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "No business found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("GET_BUSINESS_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
