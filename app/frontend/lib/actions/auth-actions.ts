"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { registerSchema, loginSchema, changePasswordSchema } from "@/(auth)/_components/schema";
import { ENDPOINTS } from "@/lib/endpoints";
import { setTokenCookie, getTokenCookie, deleteTokenCookie } from "@/lib/cookies";

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

    const responseData = await response.json();

    // Server-side: set httpOnly cookie for auth verification
    await setTokenCookie(responseData.data.token);

    // Return user data for client-side storage (user must handle localStorage)
    return {
      success: true as const,
      data: responseData.data,
      user: {
        id: responseData.data.user._id,
        name: responseData.data.user.full_name,
        email: responseData.data.user.email,
        phone: responseData.data.user.phone,
        vehicleNumber: responseData.data.user.vehicle_number,
        vehicleType: responseData.data.user.vehicle_type,
        role: responseData.data.user.role,
      },
      token: responseData.data.token,
      message: "Login successful",
    };
  } catch {
    return {
      success: false as const,
      message: "Network error. Please try again.",
    };
  }
}

export async function changePasswordAction(data: unknown) {
  const result = changePasswordSchema.safeParse(data);
  if (!result.success) {
    return {
      success: false as const,
      errors: result.error.flatten().fieldErrors,
      message: "Validation failed",
    };
  }

  try {
    const baseUrl = await getBaseUrl();
    const token = await getTokenCookie();
    const response = await fetch(`${baseUrl}${ENDPOINTS.auth.changePassword}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(result.data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false as const,
        message: error.message || "Failed to update password",
      };
    }

    return {
      success: true as const,
      message: "Password updated successfully",
    };
  } catch {
    return {
      success: false as const,
      message: "Network error. Please try again.",
    };
  }
}
export const handleRequestPasswordReset = async (email: string) => {
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Request password reset failed' };
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Request password reset failed';
      return { success: false, message };
    }
  };

export const handleResetPassword = async (token: string, newPassword: string) => {
    try {
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, message: error.message || 'Reset password failed' };
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Reset password failed';
      return { success: false, message };
    }
  }

export const resetPasswordAction = async (prevState: { success: boolean; message: string }, formData: FormData) => {
    const token = (formData.get('token') as string) || '';
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match' };
    }

    const result = await handleResetPassword(token, password);
    if (result.success) {
      redirect('/frontend/login');
    }
    return result;
  }

export async function logoutAction() {
  try {
    await deleteTokenCookie();
    return { success: true as const, message: "Logged out successfully" };
  } catch {
    return { success: false as const, message: "Network error. Please try again." };
  }
}

