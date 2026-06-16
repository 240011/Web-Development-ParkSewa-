import type { IUser } from "../models/user.model";

export const DUMMY_ADMIN_ID = "admin";
export const DUMMY_ADMIN_EMAIL = "admin@parksewa.com";
export const DUMMY_ADMIN_PASSWORD = "admin@123";

export const DUMMY_ADMIN_USER = {
  _id: DUMMY_ADMIN_ID,
  full_name: "Admin User",
  email: DUMMY_ADMIN_EMAIL,
  phone: "0000000000",
  password: DUMMY_ADMIN_PASSWORD,
  vehicle_number: "ADMIN",
  vehicle_type: "Car",
  profileImageUrl: null,
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as IUser;

export function isDummyAdminLogin(email: string, password: string) {
  return email.toLowerCase() === DUMMY_ADMIN_EMAIL && password === DUMMY_ADMIN_PASSWORD;
}

export function isDummyAdminToken(token?: string | null) {
  if (!token) return false;

  try {
    const payload = token.split(".")[1];
    if (!payload) return false;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      role?: string;
    };

    return decoded.userId === DUMMY_ADMIN_ID && decoded.role === "admin";
  } catch {
    return false;
  }
}
