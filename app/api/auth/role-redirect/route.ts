import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — redirect user to the correct page based on their role
// Used as OAuth callbackUrl so we route correctly after login
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  if (user?.role === "BUSINESS") {
    return NextResponse.redirect(new URL("/biz/dashboard", baseUrl));
  }
  if (user?.role === "CONSUMER") {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  // New user with no role yet
  return NextResponse.redirect(new URL("/welcome", baseUrl));
}
