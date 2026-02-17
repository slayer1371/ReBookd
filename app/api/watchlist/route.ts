import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toggleWatchlistSchema } from "@/lib/validations";

// POST — toggle watchlist for a business
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = toggleWatchlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { businessId } = parsed.data;

  // Check if already watching
  const existing = await prisma.watchlist.findUnique({
    where: {
      userId_businessId: {
        userId: session.user.id,
        businessId,
      },
    },
  });

  if (existing) {
    // Un-watch
    await prisma.watchlist.delete({ where: { id: existing.id } });
    return NextResponse.json({ watching: false });
  }

  // Watch
  await prisma.watchlist.create({
    data: {
      userId: session.user.id,
      businessId,
    },
  });

  return NextResponse.json({ watching: true }, { status: 201 });
}

// GET — list user's watchlist
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watchlist = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          address: true,
          city: true,
          avgRating: true,
          logoUrl: true,
          _count: {
            select: {
              cancellations: {
                where: {
                  status: "AVAILABLE",
                  expiresAt: { gt: new Date() },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(watchlist);
}
