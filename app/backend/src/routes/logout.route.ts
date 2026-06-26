import { NextResponse } from "next/server";
import { TOKEN_COOKIE_DELETE_MAX_AGE, TOKEN_COOKIE_NAME } from "../configs/auth";

export async function logoutRoute() {
  const response = NextResponse.json(
    { success: true, statusCode: 200, message: "Logged out successfully", data: null },
    { status: 200 }
  );

  response.cookies.set(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_COOKIE_DELETE_MAX_AGE,
  });

  return response;
}
