"use server";

import { headers } from "next/headers";
import { registerSchema, loginSchema } from "@/(auth)/_components/schema";
import { ENDPOINTS } from "@/lib/endpoints";
import { setTokenCookie, deleteTokenCookie } from "@/lib/cookies";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function registerAction(data: unknown) {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }

  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}${ENDPOINTS.auth.register}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false as const,
        message: error.message || "Registration failed",
      };
    }

    const data = await response.json();
    return {
      success: true as const,
      data: data.data,
      message: "Registration successful",
    };
  } catch {
    return {
      success: false as const,
      message: "Network error. Please try again.",
    };
  }
}

export async function loginAction(data: unknown) {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }

  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}${ENDPOINTS.auth.login}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false as const,
        message: error.message || "Login failed",
      };
    }

    const data = await response.json();
    await setTokenCookie(data.data.token);
    return {
      success: true as const,
      data: data.data,
      message: "Login successful",
    };
  } catch {
    return {
      success: false as const,
      message: "Network error. Please try again.",
    };
  }
}

export async function logoutAction() {
  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}${ENDPOINTS.auth.logout}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return { success: false as const, message: "Logout failed" };
    }

    await deleteTokenCookie();

    return { success: true as const, message: "Logged out successfully" };
  } catch {
    return { success: false as const, message: "Network error. Please try again." };
  }
}
