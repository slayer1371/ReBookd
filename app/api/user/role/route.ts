import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RoleSchema = z.object({
  role: z.enum(["CONSUMER", "BUSINESS"]),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { role } = RoleSchema.parse(body);

    // Update user role
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { role },
      select: { id: true, role: true, email: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Failed to set role:", error);
    return NextResponse.json(
      { error: "Invalid role or server error" },
      { status: 400 }
    );
  }
}
