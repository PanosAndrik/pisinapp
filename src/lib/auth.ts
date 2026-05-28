import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "pisinapp_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  role: "SUPER_ADMIN" | "ADMIN" | "TECHNICIAN";
  companyId: string;
  exp: number;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(body);
  return `${body}.${signature}`;
}

function decodeSession(raw: string): SessionPayload | null {
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = signPayload(body);
  const valid =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) return null;

  const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
  if (payload.exp < Date.now()) return null;
  return payload;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const calculated = scryptSync(password, salt, 64).toString("hex");
  return calculated === hash;
}

export async function signIn(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, role: true, companyId: true, passwordHash: true, isActive: true },
  });

  if (!user || !user.passwordHash || !user.isActive) return false;
  if (!verifyPassword(password, user.passwordHash)) return false;

  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return true;
}

export async function signOut() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession() {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/signin");
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") redirect("/app/technician");
  return session;
}

export async function requireSuperAdminSession() {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") redirect("/app");
  return session;
}
