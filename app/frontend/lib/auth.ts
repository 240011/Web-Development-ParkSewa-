import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";

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
