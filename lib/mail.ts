import sgMail from "@sendgrid/mail";
import { prisma } from "@/lib/prisma";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendVerificationEmail(email: string) {
  // 1. Generate a random 6-digit code
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(new Date().getTime() + 10 * 60 * 1000); // 10 minutes from now

  // 2. Save it to the database (Update existing or create new)
  // We delete old tokens for this email first to keep it clean
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  // 3. Send the Email
  const msg = {
    to: email,
    from: process.env.FROM_EMAIL || "noreply@rebookd.com",
    subject: "Your Verification Code",
    html: `<p>Your code is: <strong>${token}</strong></p>`,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
}