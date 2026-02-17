import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendBusinessBookingNotification } from "@/lib/email";

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
        // We need to fetch the booking with related data to send the email
        const booking = await prisma.booking.findFirst({
          where: {
            cancellationId,
            stripePaymentIntentId: pi.id,
          },
          include: {
            user: true,
            cancellation: {
              include: {
                service: {
                  include: {
                    business: true,
                  },
                },
              },
            },
          },
        });

        if (booking) {
          await prisma.booking.update({
             where: { id: booking.id },
             data: { status: "CONFIRMED" },
          });

          // Send confirmation email to customer
          const { user, cancellation } = booking;
          const { service } = cancellation;
          const { business } = service;

          if (user.email) {
            await sendBookingConfirmation({
              to: user.email,
              customerName: user.name || "Customer",
              serviceName: service.name,
              businessName: business.name,
              businessAddress: business.address,
              businessCity: business.city,
              appointmentTime: cancellation.originalStartTime.toISOString(),
              duration: service.durationMinutes,
              originalPrice: service.originalPrice.toString(),
              discountPercent: cancellation.discountPercent,
              paidAmount: cancellation.discountedPrice.toString(),
            });
          }
          
           // Send notification to business 
           if (business.email) {
             await sendBusinessBookingNotification({
               to: business.email,
               businessName: business.name,
               serviceName: service.name,
               customerName: user.name || "Customer",
               appointmentTime: cancellation.originalStartTime.toISOString(),
               paidAmount: cancellation.discountedPrice.toString(),
               platformFee: "2.00", // Example fixed fee, replace with dynamic calc if needed
             });
           }
        }
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
