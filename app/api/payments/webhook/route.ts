import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

// Stripe webhook to handle payment events
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const cancellationId = pi.metadata?.cancellationId;

      if (cancellationId) {
        // Update booking with confirmed payment
        await prisma.booking.updateMany({
          where: {
            cancellationId,
            stripePaymentIntentId: pi.id,
          },
          data: { status: "CONFIRMED" },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;
      const cancellationId = pi.metadata?.cancellationId;

      if (cancellationId) {
        // Revert: cancel booking and make slot available again
        await prisma.$transaction([
          prisma.booking.updateMany({
            where: {
              cancellationId,
              stripePaymentIntentId: pi.id,
            },
            data: { status: "CANCELLED" },
          }),
          prisma.cancellation.update({
            where: { id: cancellationId },
            data: { status: "AVAILABLE", bookedAt: null },
          }),
        ]);
      }
      break;
    }

    case "account.updated": {
      // Stripe Connect account updated (onboarding completed)
      const account = event.data.object;
      if (account.metadata?.rebookd && account.details_submitted) {
        await prisma.business.updateMany({
          where: { stripeAccountId: account.id },
          data: {}, // Just confirm it exists; could set a flag
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
