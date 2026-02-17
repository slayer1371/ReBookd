import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// POST — Create a login link for the business's Stripe Express dashboard
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { ownerId: session.user.id },
      select: { stripeAccountId: true },
    });

    if (!business?.stripeAccountId) {
      return NextResponse.json({ error: "No connected Stripe account found" }, { status: 404 });
    }

    const loginLink = await getStripe().accounts.createLoginLink(
      business.stripeAccountId
    );

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error("STRIPE_LOGIN_LINK_ERROR", error);
    return NextResponse.json(
      { error: "Failed to generate login link" },
      { status: 500 }
    );
  }
}
