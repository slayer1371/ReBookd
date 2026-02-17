import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — get a specific booking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      cancellation: {
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
              phone: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Only allow the booker or the business owner to view
  if (booking.userId !== session.user.id) {
    const business = await prisma.business.findUnique({
      where: { id: booking.businessId },
      select: { ownerId: true },
    });
    if (business?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(booking);
}
