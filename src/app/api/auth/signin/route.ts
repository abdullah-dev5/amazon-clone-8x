import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Per-account brute-force guard: 10 attempts per 15 minutes. Keyed by the
  // submitted email (not IP) since that's the thing actually being
  // attacked, and works the same whether or not IP is reliably available.
  if (!checkRateLimit(`signin:${email}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSessionCookie(user.id);
  await mergeGuestCartIntoUser(user.id);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
