import { NextResponse } from "next/server";

export async function logoutRoute() {
  const response = NextResponse.json(
    { success: true, statusCode: 200, message: "Logged out successfully", data: null },
    { status: 200 }
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
