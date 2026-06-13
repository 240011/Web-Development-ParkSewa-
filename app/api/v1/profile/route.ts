import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectDB } from "../../../backend/src/configs/database";
import { ApiResponseHelper } from "../../../backend/src/helpers/ApiResponseHelper";
import { UserRepository } from "../../../backend/src/repositories/user.repository";
import { UpdateProfileInput, updateProfileSchema } from "../../../backend/src/types/user.type";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";

function getToken(request: NextRequest, tokenCookie?: string) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return tokenCookie;
}

async function updateProfileRoute(request: NextRequest) {
  if (request.method !== "PATCH" && request.method !== "PUT") {
    return NextResponse.json(
      ApiResponseHelper.error("Method not allowed", 405),
      { status: 405 }
    );
  }

  try {
    await connectDB();

    const cookieStore = await cookies();
    const authToken = getToken(request, cookieStore.get("token")?.value);

    if (!authToken) {
      return NextResponse.json(
        ApiResponseHelper.error("Unauthorized - No token provided", 401),
        { status: 401 }
      );
    }

    const payload = jwt.verify(authToken, JWT_SECRET) as { userId: string };
    const body = (await request.json().catch(() => ({}))) as UpdateProfileInput;
    const validatedData = updateProfileSchema.parse(body);
    const user = await new UserRepository().updateProfile(payload.userId, {
      full_name: validatedData.fullName,
      email: validatedData.email,
      phone: validatedData.phone,
      vehicle_number: validatedData.licensePlate,
      vehicle_type: validatedData.vehicleType,
      profileImageUrl: validatedData.profileImageUrl,
    });

    if (!user) {
      return NextResponse.json(
        ApiResponseHelper.error("User not found", 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponseHelper.success(
        {
          fullName: user.full_name,
          email: user.email,
          phone: user.phone,
          licensePlate: user.vehicle_number,
          vehicleType: user.vehicle_type,
          profileImageUrl: user.profileImageUrl ?? null,
        },
        "Profile updated successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "Failed to update profile";
    const statusCode = name === "JsonWebTokenError" || name === "TokenExpiredError" ? 401 : 400;
    return NextResponse.json(
      ApiResponseHelper.error(message, statusCode),
      { status: statusCode }
    );
  }
}

export const PATCH = updateProfileRoute;
export const PUT = updateProfileRoute;
