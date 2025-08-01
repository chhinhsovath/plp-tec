import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    // Telegram login provider
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }

        try {
          // Verify JWT token from Telegram auth
          const decoded = verify(
            credentials.token,
            process.env.NEXTAUTH_SECRET || 'secret'
          ) as any;

          const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            include: {
              userRoles: {
                include: {
                  role: true
                }
              }
            }
          });

          if (!user) {
            return null;
          }

          // Get the first role (should be updated to handle multiple roles properly)
          const primaryRole = user.userRoles[0]?.role;

          return {
            id: user.id,
            email: user.email,
            name: decoded.name,
            role: primaryRole?.name || 'STUDENT',
            telegramId: decoded.telegramId
          };
        } catch (error) {
          console.error("Telegram auth error:", error);
          return null;
        }
      }
    }),
    // Email/Password provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user || !user.password) {
            return null;
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isCorrectPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.telegramId = user.telegramId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.telegramId = token.telegramId as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};