import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST — create a Stripe Connect account + onboarding link for the business
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    include: { owner: { select: { email: true } } },
  });

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  let accountId = business.stripeAccountId;

  // Create Stripe Connect account if not exists
  if (!accountId) {
    const account = await getStripe().accounts.create({
      type: "express",
      email: business.owner.email || undefined,
      business_type: "individual",
      metadata: {
        businessId: business.id,
        rebookd: "true",
      },
    });
    accountId = account.id;

    await prisma.business.update({
      where: { id: business.id },
      data: { stripeAccountId: accountId },
    });
  }

  // Create onboarding link
  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXTAUTH_URL}/biz/dashboard?stripe=refresh`,
    return_url: `${process.env.NEXTAUTH_URL}/biz/dashboard?stripe=success`,
    type: "account_onboarding",
  });

  return NextResponse.json({ url: accountLink.url });
}

// GET — check if business has completed Stripe onboarding
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await prisma.business.findUnique({
    where: { ownerId: session.user.id },
    select: { stripeAccountId: true },
  });

  if (!business?.stripeAccountId) {
    return NextResponse.json({ connected: false, detailsSubmitted: false });
  }

  const account = await getStripe().accounts.retrieve(business.stripeAccountId);

  return NextResponse.json({
    connected: true,
    detailsSubmitted: account.details_submitted,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });
}
