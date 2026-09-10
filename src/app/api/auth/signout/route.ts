import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { withApiErrorLogging } from "@/lib/api-error";

export const POST = withApiErrorLogging("POST /api/auth/signout", async () => {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
});
