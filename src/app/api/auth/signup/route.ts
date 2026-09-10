import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { mergeGuestCartIntoUser } from "@/lib/cart";
import { checkRateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation/auth";
import { parseRequestBody } from "@/lib/validation/helpers";

export async function POST(req: NextRequest) {
  // Coarse spam-signup guard: 20 accounts per hour from the same client.
  // Without a reverse proxy in front of it, there's no real client IP to
  // key on in local dev (x-forwarded-for is simply absent) — every request
  // would collapse into one shared "unknown" bucket and start throttling
  // unrelated local testing. Only enforce this once a real IP is present,
  // which in practice means "once actually deployed behind a proxy."
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  if (ip && !checkRateLimit(`signup:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many accounts created from this connection. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = parseRequestBody(signupSchema, body);
  if (!parsed.success) return parsed.response;
  const { email, password, name } = parsed.data;

  // The findUnique below is a courtesy check for the common case (fast,
  // friendly error). It can't fully prevent a concurrent duplicate signup —
  // the User.email @unique constraint is what actually guarantees
  // correctness, caught as P2002 below.
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let user;
  try {
    user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email, name, passwordHash } });
      await tx.cart.create({ data: { userId: created.id } });
      await tx.wishlist.create({ data: { userId: created.id } });
      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    throw err;
  }

  await setSessionCookie(user.id);
  await mergeGuestCartIntoUser(user.id);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
