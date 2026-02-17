import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";
import { calculateDiscount, calculateDiscountedPrice } from "@/lib/discount";

// POST — create a Stripe PaymentIntent for a cancellation slot
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cancellationId } = await req.json();
  if (!cancellationId) {
    return NextResponse.json({ error: "cancellationId required" }, { status: 400 });
  }

  const cancellation = await prisma.cancellation.findUnique({
    where: { id: cancellationId },
    include: {
      service: true,
      business: {
        select: {
          stripeAccountId: true,
          platformFeeRate: true,
          name: true,
        },
      },
    },
  });

  if (!cancellation) {
    return NextResponse.json({ error: "Cancellation not found" }, { status: 404 });
  }

  if (cancellation.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Slot is no longer available" }, { status: 409 });
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

  const amountInCents = Math.round(discountedPrice * 100);
  const platformFeeInCents = Math.round(
    amountInCents * (cancellation.business.platformFeeRate || 0.10)
  );

  // Build PaymentIntent options
  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: amountInCents,
    currency: "usd",
    metadata: {
      cancellationId: cancellation.id,
      userId: session.user.id,
      businessName: cancellation.business.name,
      serviceName: cancellation.service.name,
    },
    ...(cancellation.business.stripeAccountId
      ? {
          transfer_data: {
            destination: cancellation.business.stripeAccountId,
          },
          application_fee_amount: platformFeeInCents,
        }
      : {}),
  };

  const paymentIntent = await getStripe().paymentIntents.create(paymentIntentData);

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount: discountedPrice,
    discountPercent,
  });
}
