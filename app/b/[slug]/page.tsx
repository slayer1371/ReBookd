import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Components
import BusinessProfileClient from "./client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBusiness(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      services: true,
      reviews: {
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      cancellations: {
        where: {
          status: "AVAILABLE",
          expiresAt: { gt: new Date() },
        },
        include: {
          service: true,
        },
        orderBy: { originalStartTime: "asc" },
      },
      _count: {
        select: { watchers: true },
      },
    },
  });

  return business;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!business) return { title: "Business Not Found" };

  return {
    title: `${business.name} - Rebookd`,
    description: business.description || `Book last-minute appointments at ${business.name}.`,
  };
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);
  const session = await getServerSession(authOptions);

  if (!business) {
    notFound();
  }

  // Check if user is watching
  let isWatching = false;
  if (session?.user?.id) {
    const watch = await prisma.watchlist.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId: business.id,
        },
      },
    });
    isWatching = !!watch;
  }

  // Serialize Decimal types for client component
  const serializedBusiness = {
    ...business,
    services: business.services.map((s) => ({
      ...s,
      originalPrice: Number(s.originalPrice),
    })),
    cancellations: business.cancellations.map((c) => ({
      ...c,
      discountedPrice: Number(c.discountedPrice),
      service: {
        ...c.service,
        originalPrice: Number(c.service.originalPrice),
      },
    })),
  };

  return (
    <BusinessProfileClient
      business={serializedBusiness}
      isWatching={isWatching}
      currentUserId={session?.user?.id}
    />
  );
}
