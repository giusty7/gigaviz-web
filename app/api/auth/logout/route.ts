import { NextResponse } from "next/server";
import { WORKSPACE_COOKIE } from "@/lib/workspaces";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WORKSPACE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
