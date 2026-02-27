import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import * as bcrypt from "bcrypt";
import { getSystemSettings } from "@/lib/settings";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                nik: { label: "NIK", type: "text", placeholder: "8124070002" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.nik || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { nik: credentials.nik },
                });

                if (!user) return null;

                const settings = getSystemSettings();
                const now = new Date();

                // Check lockout
                if (user.lockedUntil && user.lockedUntil > now) {
                    throw new Error(`Akun terkunci. Coba lagi setelah beberapa menit.`);
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!passwordMatch) {
                    if (settings.security?.maxLoginAttempts) {
                        const newAttempts = (user.failedLoginAttempts || 0) + 1;
                        let lockedUntil = null;

                        if (newAttempts >= settings.security.maxLoginAttempts) {
                            lockedUntil = new Date(now.getTime() + (settings.security.lockoutDuration || 15) * 60000);
                        }

                        await prisma.user.update({
                            where: { id: user.id },
                            data: { failedLoginAttempts: newAttempts, lockedUntil }
                        });

                        if (lockedUntil) {
                            throw new Error(`Terlalu banyak percobaan gagal. Akun terkunci.`);
                        }
                    }
                    return null;
                }

                if (user.failedLoginAttempts > 0) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { failedLoginAttempts: 0, lockedUntil: null }
                    });
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    location: user.location,
                    image: user.image,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.location = user.location;
                token.image = user.image;
            }
            if (trigger === "update" && session) {
                token.name = session.name;
                token.email = session.email;
                token.image = session.image;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.location = token.location;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.image;
            }
            return session;
        },
    },
    pages: {
        signIn: "/", // Custom login page
    },
    session: {
        strategy: "jwt",
        maxAge: ((() => {
            try {
                // Ensure dynamic read during runtime (avoid static execution context if possible, but Next.js will execute this)
                const settings = require("@/lib/settings").getSystemSettings();
                return (settings?.security?.sessionTimeout || 480) * 60; // minutes to seconds
            } catch {
                return 480 * 60;
            }
        })()),
    },
    secret: process.env.NEXTAUTH_SECRET,
};
