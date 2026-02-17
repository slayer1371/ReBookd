import { NextAuthOptions, Session } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter" 
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

// Extend the session type to include user ID
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt", 
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }), 
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" , placeholder : "***********"}
      },
      authorize: async (credentials) => {
        if(!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }
        // Add your own logic here to find the user and verify the password
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if(!user || !user.password) {
          throw new Error("No user found with the given email")
        }

        const isCorrectPassword = await bcrypt.compare(credentials.password, user.password)

        if(!isCorrectPassword) {
          throw new Error("Incorrect password")
        }

        return user;
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET, 
  callbacks: {
    // This helper makes the user ID available to your dashboard later
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        // Fetch role from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role || undefined;
      }
      // Refresh role on update trigger
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role || token.role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
}