import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — expire all cancellations past their start time
// Call this via a cron job (e.g. Vercel Cron, GitHub Actions)
// Secured by a simple bearer token

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedToken = process.env.CRON_SECRET;

  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find and expire all overdue AVAILABLE cancellations
  const result = await prisma.cancellation.updateMany({
    where: {
      status: "AVAILABLE",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({
    expired: result.count,
    timestamp: now.toISOString(),
  });
}
