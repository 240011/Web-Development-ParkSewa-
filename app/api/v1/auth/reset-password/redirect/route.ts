import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const target = new URL("/frontend/reset_password", request.url);
  target.searchParams.set("token", token);
  return NextResponse.redirect(target, 302);
}
