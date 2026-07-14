import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

// Shared workspace state, keyed. Gated by the same passphrase cookie as the app,
// and served only from the server so the service-role key stays private.

const ALLOWED = new Set(["assumptions", "workshop", "scenarios"]);
const COOKIE = "az_auth";

async function authed(): Promise<boolean> {
  const pass = process.env.AGENCY_ZERO_PASSPHRASE;
  if (!pass) return true; // unconfigured => open (dev)
  const token = (await cookies()).get(COOKIE)?.value;
  return token === pass;
}

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!ALLOWED.has(key)) return NextResponse.json({ error: "bad key" }, { status: 400 });
  if (!(await authed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ data: null, remote: false });
  const { data, error } = await sb.from("az_state").select("data").eq("id", key).maybeSingle();
  if (error) return NextResponse.json({ data: null, remote: true, error: error.message });
  return NextResponse.json({ data: data?.data ?? null, remote: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!ALLOWED.has(key)) return NextResponse.json({ error: "bad key" }, { status: 400 });
  if (!(await authed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sb = supabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, remote: false });
  const body = await req.json().catch(() => null);
  const { error } = await sb
    .from("az_state")
    .upsert({ id: key, data: body, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ ok: false, remote: true, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, remote: true });
}
