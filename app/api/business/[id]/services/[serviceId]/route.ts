import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateServiceSchema } from "@/lib/validations";

// PUT /api/business/[id]/services/[serviceId] — Update a service
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, serviceId } = await params;

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const service = await prisma.service.update({
      where: { id: serviceId, businessId: id },
      data: parsed.data,
    });

    return NextResponse.json(service);
  } catch (error) {
    console.error("UPDATE_SERVICE_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/business/[id]/services/[serviceId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, serviceId } = await params;

    const business = await prisma.business.findUnique({ where: { id } });
    if (!business || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.service.delete({
      where: { id: serviceId, businessId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_SERVICE_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
