import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToMongoDB } from "../../../_utils/db";
import { User } from "../../../_utils/db";
import { getTokenFromRequest, verifyToken } from "../../../_utils/auth";

async function requireAdmin(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: "Unauthorized - Admin token required" }, { status: 401 });
  }

  try {
    const payload = verifyToken<{ userId?: string; role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - Admin access required" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  return null;
}

type UserDoc = {
  _id: { toString: () => string };
  full_name: string;
  email: string;
  phone: string;
  role: "user" | "admin";
  createdAt: string;
};

function sanitizeUser(u: UserDoc) {
  return {
    id: u._id.toString(),
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  await connectToMongoDB();
  try {
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 10);
    const search = request.nextUrl.searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      (User as unknown as { find: (q: Record<string, unknown>) => { sort: (s: Record<string, unknown>) => { skip: (n: number) => { limit: (n: number) => { exec: () => Promise<UserDoc[]> } } } } }).find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      (User as unknown as { countDocuments: (q: Record<string, unknown>) => Promise<number> }).countDocuments(query),
    ]);

    const sanitized = users.map(sanitizeUser);

    return NextResponse.json(
      { data: sanitized, meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, message: "Users retrieved", status: 200 },
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  await connectToMongoDB();
  try {
    const body = await request.json();
    const { full_name, email, phone, password, role, vehicle_number, vehicle_type } = body;

    if (!full_name || !email || !phone || !password) {
      return NextResponse.json({ message: "full_name, email, phone and password are required" }, { status: 400 });
    }

    const existing = await (User as unknown as { findOne: (q: Record<string, unknown>) => Promise<UserDoc | null> }).findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await (User as unknown as { create: (d: Record<string, unknown>) => Promise<UserDoc> }).create({
      full_name,
      email,
      phone,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user",
      vehicle_number: vehicle_number || "",
      vehicle_type: vehicle_type || "Car",
    });

    const sanitized = sanitizeUser(user);

    return NextResponse.json({ data: sanitized, message: "User created", status: 201 }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ message }, { status: 500 });
  }
}
