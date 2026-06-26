import { cookies } from "next/headers";
import axios from "axios";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
});

export async function getCurrentUserFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const jwt = await import("jsonwebtoken");
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string; full_name: string; phone: string; vehicle_number: string; vehicle_type: string };
    return payload;
  } catch {
    return null;
  }
}

export const requestPasswordReset = async (email: string) => {
  try {
    const response = await axiosInstance.post(
      "/api/v1/auth/request-password-reset",
      { email }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Request password reset failed");
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await axiosInstance.post(
      `/api/v1/auth/reset-password/${token}`,
      { newPassword: newPassword }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Reset password failed");
  }
};