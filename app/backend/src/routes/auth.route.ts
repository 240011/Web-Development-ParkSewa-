import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { RegisterDTO } from "../dtos/user.dto";
import { LoginDTO } from "../dtos/user.dto";
import { ChangePasswordDTO } from "../dtos/user.dto";
import { UserService } from "../services/user.services";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import {
  DUMMY_ADMIN_EMAIL,
  DUMMY_ADMIN_USER,
  isDummyAdminLogin,
  isDummyAdminToken,
} from "../constants/auth.constants";
import type { IUser } from "../models/user.model";

const userService = new UserService();
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";

function publicUser(user: IUser) {
  return {
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    vehicle_number: user.vehicle_number,
    vehicle_type: user.vehicle_type,
    profile_image_url: user.profileImageUrl ?? null,
    role: user.role,
  };
}

function createAuthResponse(user: IUser, token: string, statusCode = 200) {
  const response = NextResponse.json(
    ApiResponseHelper.success(
      { token, user: publicUser(user) },
      "Login successful",
      statusCode
    ),
    { status: statusCode }
  );

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  return response;
}

export async function registerRoute(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();
    const validatedData = RegisterDTO.validate(body);
    const { user, token } = await userService.register(validatedData);

    const response = NextResponse.json(
      {
        success: true,
        statusCode: 201,
        message: "User registered successfully",
        data: {
          _id: user._id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          vehicle_number: user.vehicle_number,
          vehicle_type: user.vehicle_type,
          profile_image_url: user.profileImageUrl ?? null,
          token,
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Registration failed";
    if (message.includes("already exists")) {
      return NextResponse.json(
        { success: false, statusCode: 409, message, data: null },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, statusCode: 400, message, data: null },
      { status: 400 }
    );
  }
}

export async function loginRoute(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LoginDTO.validate(body);

    if (isDummyAdminLogin(validatedData.email, validatedData.password)) {
      const token = jwt.sign(
        { userId: DUMMY_ADMIN_USER._id, email: DUMMY_ADMIN_EMAIL, role: "admin" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return createAuthResponse(DUMMY_ADMIN_USER, token);
    }

    await connectDB();
    const { user, token } = await userService.login(validatedData);

    return createAuthResponse(user, token);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json(
      ApiResponseHelper.error(message, 401),
      { status: 401 }
    );
  }
}

function getToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return request.cookies.get("token")?.value;
}

export async function changePasswordRoute(request: NextRequest) {
  await connectDB();

  const token = getToken(request);
  if (!token) {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - No token provided", 401),
      { status: 401 }
    );
  }

  if (isDummyAdminToken(token)) {
    return NextResponse.json(
      ApiResponseHelper.error("Password cannot be changed for the demo admin account", 403),
      { status: 403 }
    );
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    const body = await request.json();
    const validatedData = ChangePasswordDTO.validate(body);
    const user = await userService.changePassword(payload.userId, validatedData);

    return NextResponse.json(
      ApiResponseHelper.success(
        { user: publicUser(user) },
        "Password updated successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update password";
    const statusCode = message === "Current password is incorrect"
      ? 401
      : message === "User not found"
        ? 404
        : message.includes("demo admin")
          ? 403
          : 400;

    return NextResponse.json(
      ApiResponseHelper.error(message, statusCode),
      { status: statusCode }
    );
  }
}
