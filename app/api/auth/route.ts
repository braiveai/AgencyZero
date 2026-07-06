import { NextResponse } from "next/server";

const COOKIE = "az_auth";

export async function POST(req: Request) {
  const pass = process.env.AGENCY_ZERO_PASSPHRASE;
  const { passphrase } = await req.json().catch(() => ({ passphrase: "" }));

  if (!pass || passphrase !== pass) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, pass, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
