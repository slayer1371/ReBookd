import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validations";
import { sendBookingConfirmation, sendBusinessBookingNotification } from "@/lib/email";

// POST — book a cancellation slot
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { cancellationId } = parsed.data;

  // Fetch the cancellation with service + business + owner info
  const cancellation = await prisma.cancellation.findUnique({
    where: { id: cancellationId },
    include: {
      service: true,
      business: {
        include: {
          owner: { select: { email: true, name: true } },
        },
      },
    },
  });

  if (!cancellation) {
    return NextResponse.json({ error: "Cancellation not found" }, { status: 404 });
  }

  if (cancellation.status !== "AVAILABLE") {
    return NextResponse.json({ error: "This slot is no longer available" }, { status: 409 });
  }

  if (new Date() >= cancellation.expiresAt) {
    await prisma.cancellation.update({
      where: { id: cancellationId },
      data: { status: "EXPIRED" },
    });
    return NextResponse.json({ error: "This slot has expired" }, { status: 410 });
  }

  // Prevent self-booking
  if (cancellation.business.ownerId === session.user.id) {
    return NextResponse.json({ error: "Cannot book your own cancellation" }, { status: 403 });
  }

  // Calculate payment
  const paidAmount = Number(cancellation.discountedPrice);
  const platformFeeRate = cancellation.business.platformFeeRate || 0.10;
  const platformFee = Math.round(paidAmount * platformFeeRate * 100) / 100;

  // Atomic booking
  const booking = await prisma.$transaction(async (tx) => {
    const slot = await tx.cancellation.findUnique({
      where: { id: cancellationId },
      select: { status: true },
    });
    if (slot?.status !== "AVAILABLE") {
      throw new Error("SLOT_TAKEN");
    }

    const b = await tx.booking.create({
      data: {
        userId: session.user.id,
        cancellationId,
        businessId: cancellation.businessId,
        paidAmount,
        platformFee,
        status: "CONFIRMED",
        stripePaymentIntentId: body.paymentIntentId || null,
      },
    });

    await tx.cancellation.update({
      where: { id: cancellationId },
      data: { status: "BOOKED", bookedAt: new Date() },
    });

    return b;
  });

  // Send email confirmations (fire-and-forget, don't block the response)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  if (user?.email) {
    sendBookingConfirmation({
      to: user.email,
      customerName: user.name || "Customer",
      serviceName: cancellation.service.name,
      businessName: cancellation.business.name,
      businessAddress: cancellation.business.address,
      businessCity: cancellation.business.city,
      appointmentTime: cancellation.originalStartTime.toISOString(),
      duration: cancellation.service.durationMinutes,
      originalPrice: Number(cancellation.service.originalPrice).toFixed(2),
      discountPercent: cancellation.discountPercent,
      paidAmount: paidAmount.toFixed(2),
    }).catch(console.error);
  }

  if (cancellation.business.owner.email) {
    sendBusinessBookingNotification({
      to: cancellation.business.owner.email,
      businessName: cancellation.business.name,
      serviceName: cancellation.service.name,
      customerName: user?.name || "A customer",
      appointmentTime: cancellation.originalStartTime.toISOString(),
      paidAmount: paidAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
    }).catch(console.error);
  }

  return NextResponse.json(booking, { status: 201 });
}

// GET — list bookings for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      review: {
        select: { id: true, rating: true },
      },
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
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}
