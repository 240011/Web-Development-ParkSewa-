import jwt from "jsonwebtoken";
import type { NextRequest, NextResponse } from "next/server";

export const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";
export const TOKEN_EXPIRATION = "1h";
export const TOKEN_COOKIE_NAME = "token";
export const TOKEN_COOKIE_MAX_AGE = 3600;
export const TOKEN_COOKIE_DELETE_MAX_AGE = 0;

export function getTokenFromRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return request.cookies.get(TOKEN_COOKIE_NAME)?.value;
}

export function decodeToken<T = { userId?: string; role?: string }>(token?: string | null) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function signToken(payload: { userId: string | { toString: () => string }; email: string; role: string }) {
  return jwt.sign({ ...payload, userId: String(payload.userId) }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
}

export function verifyToken<T = { userId: string }>(token: string) {
  return jwt.verify(token, JWT_SECRET) as T;
}

export function setTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_COOKIE_MAX_AGE,
  });

  return response;
}
