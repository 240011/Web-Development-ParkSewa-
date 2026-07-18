import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToMongoDB } from "../../../../_utils/db";
import { User } from "../../../../../backend/src/models/user.model";
import { getTokenFromRequest, verifyToken } from "../../../../_utils/auth";

const userModel = User as unknown as {
  findById: (id: string) => { exec: () => Promise<{ _id: { toString: () => string }; full_name: string; email: string; phone: string; role: string; createdAt: string | Date } | null> };
  findByIdAndUpdate: (id: string, update: Record<string, unknown>, opts: { new: boolean }) => { exec: () => Promise<{ _id: { toString: () => string }; full_name: string; email: string; phone: string; role: string; createdAt: string | Date } | null> };
  findByIdAndDelete: (id: string) => { exec: () => Promise<{ _id: { toString: () => string } } | null> };
};

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;

  await connectToMongoDB();
  try {
    const user = await userModel.findById(id).exec();
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const sanitized = {
      id: String(user._id),
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ data: sanitized, message: "User retrieved", status: 200 }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;

  await connectToMongoDB();
  try {
    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.vehicle_number !== undefined) updateData.vehicle_number = body.vehicle_number;
    if (body.vehicle_type !== undefined) updateData.vehicle_type = body.vehicle_type;
    if (body.password !== undefined) updateData.password = await bcrypt.hash(body.password as string, 10);

    const updated = await userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const sanitized = {
      id: String(updated._id),
      full_name: updated.full_name,
      email: updated.email,
      phone: updated.phone,
      role: updated.role,
      createdAt: updated.createdAt,
    };

    return NextResponse.json({ data: sanitized, message: "User updated", status: 200 }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;

  await connectToMongoDB();
  try {
    const deleted = await userModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "User deleted", status: 200 }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ message }, { status: 500 });
  }
}