import { cookies } from "next/headers";
import { AUTH_COOKIE } from "./auth-config";

export async function getTokenCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE.name)?.value;
}

export async function setTokenCookie(token: string, maxAge = AUTH_COOKIE.maxAge) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE.name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function deleteTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
