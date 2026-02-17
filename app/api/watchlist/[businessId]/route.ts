import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/watchlist/[businessId] — Check if user is watching a business
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ watching: false });
    }

    const { businessId } = await params;

    const entry = await prisma.watchlist.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
    });

    return NextResponse.json({ watching: !!entry });
  } catch (error) {
    console.error("CHECK_WATCHLIST_ERROR", error);
    return NextResponse.json({ watching: false });
  }
}
