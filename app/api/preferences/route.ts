import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setPreferencesSchema } from "@/lib/validations";

// GET — get user preferences
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [preferences, user] = await Promise.all([
    prisma.userPreference.findMany({
      where: { userId: session.user.id },
      select: { category: true, enabled: true },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { searchRadius: true },
    }),
  ]);

  return NextResponse.json({
    preferences,
    searchRadius: user?.searchRadius ?? 10,
  });
}

// PUT — update user preferences
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = setPreferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Upsert each preference
  await prisma.$transaction(
    parsed.data.preferences.map((pref) =>
      prisma.userPreference.upsert({
        where: {
          userId_category: {
            userId: session.user.id,
            category: pref.category,
          },
        },
        update: { enabled: pref.enabled },
        create: {
          userId: session.user.id,
          category: pref.category,
          enabled: pref.enabled,
        },
      })
    )
  );

  return NextResponse.json({ success: true });
}
