import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "centsy_session";
const SESSION_DAYS = 30;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      token: hashToken(rawToken),
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export async function destroySession(rawToken: string | undefined) {
  if (!rawToken) return;
  await prisma.session.deleteMany({ where: { token: hashToken(rawToken) } });
}

export async function getSessionUser(rawToken: string | undefined | null) {
  if (!rawToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: hashToken(rawToken) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          avatarUrl: true,
          defaultMode: true,
          aiProfile: true,
          businessName: true,
          businessEmail: true,
          businessEin: true,
          stripeAccountId: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          plan: true,
          expoPushToken: true,
          receiptCloudBackup: true,
          lastLoginAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    }
    return null;
  }

  return session.user;
}

/** Resolve user from cookie or Authorization: Bearer <token> */
export async function requireUser(request?: Request) {
  let rawToken: string | undefined;

  if (request) {
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      rawToken = auth.slice(7).trim();
    }
  }

  if (!rawToken) {
    const jar = await cookies();
    rawToken = jar.get(SESSION_COOKIE)?.value;
  }

  const user = await getSessionUser(rawToken);
  if (!user) {
    throw new AuthError("Unauthorized");
  }
  return user;
}

export class AuthError extends Error {
  status = 401;
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function setSessionCookie(rawToken: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
