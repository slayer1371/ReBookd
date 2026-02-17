// app/api/register/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs" 
import { sendVerificationEmail } from "@/lib/mail"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    if (!email || !password) {
      return new NextResponse("Missing email or password", { status: 400 })
    }

    // 1. Check if user already exists
    const exists = await prisma.user.findUnique({
      where: { email }
    })

    if (exists) {
      return new NextResponse("User already exists", { status: 400 })
    }

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 3. Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || "",
        password: hashedPassword,
      },
    })

    await sendVerificationEmail(email);
    return NextResponse.json(user)

  } catch (error) {
    console.log("REGISTRATION_ERROR", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}