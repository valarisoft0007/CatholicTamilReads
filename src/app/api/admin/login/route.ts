import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { parseBody } from "@/lib/validation";
import { AdminLoginSchema } from "@/lib/validation/auth";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "default-secret-change-me"
);

// --- Rate limiting ---
const failedAttempts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { blocked: boolean } {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (record) {
    if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
      failedAttempts.delete(ip);
      return { blocked: false };
    }
    if (record.count >= RATE_LIMIT_MAX) return { blocked: true };
  }
  return { blocked: false };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    record.count += 1;
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const timestamp = new Date().toISOString();

  if (checkRateLimit(ip).blocked) {
    console.warn(`[ADMIN AUTH] Rate limit hit - IP: ${ip}, time: ${timestamp}`);
    return NextResponse.json(
      { error: "Too many failed attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = parseBody(AdminLoginSchema, body);
  if (!parsed.success) return parsed.response;

  if (parsed.data.password !== ADMIN_PASSWORD) {
    recordFailedAttempt(ip);
    console.error(`[ADMIN AUTH] Failed login attempt - IP: ${ip}, time: ${timestamp}`);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  failedAttempts.delete(ip);
  console.log(`[ADMIN AUTH] Successful login - IP: ${ip}, time: ${timestamp}`);

  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const response = NextResponse.json({ success: true });
  response.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return response;
}
