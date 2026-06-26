import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { getTokenFromRequest, setTokenCookie, verifyToken } from "../configs/auth";
import { RegisterDTO } from "../dtos/user.dto";
import { LoginDTO } from "../dtos/user.dto";
import { ChangePasswordDTO } from "../dtos/user.dto";
import { UserService } from "../services/user.services";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import type { IUser } from "../models/user.model";

const userService = new UserService();

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
    createdAt: user.createdAt,
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

  return setTokenCookie(response, token);
}

export async function registerRoute(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();
    const validatedData = RegisterDTO.validate(body);
    const { user, token } = await userService.register(validatedData);

    return setTokenCookie(NextResponse.json(
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
          createdAt: user.createdAt,
          token,
        },
      },
      { status: 201 }
    ), token);
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
  await connectDB();
  try {
    const body = await request.json();
    const validatedData = LoginDTO.validate(body);

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
  return getTokenFromRequest(request);
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

  try {
    const payload = verifyToken<{ userId: string }>(token);
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
        : 400;

    return NextResponse.json(
      ApiResponseHelper.error(message, statusCode),
      { status: statusCode }
    );
  }
}

export async function requestPasswordResetRoute(request: NextRequest) {
  await connectDB();

  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json(
        ApiResponseHelper.error("Email is required", 400),
        { status: 400 }
      );
    }

    await userService.sendResetPasswordEmail(email);

    return NextResponse.json(
      ApiResponseHelper.success(
        null,
        "If the email exists, a reset link has been sent",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send reset email";
    console.error("requestPasswordResetRoute error:", error);
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}

export async function resetPasswordRoute(request: NextRequest, { params }: { params: { token: string } }) {
  await connectDB();

  try {
    const { newPassword } = await request.json() as { newPassword: string };

    if (!params.token || !newPassword) {
      return NextResponse.json(
        ApiResponseHelper.error("Token and new password are required", 400),
        { status: 400 }
      );
    }

    const user = await userService.resetPassword(params.token, newPassword);

    return NextResponse.json(
      ApiResponseHelper.success(
        { user: publicUser(user) },
        "Password reset successfully",
        200
      ),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      ApiResponseHelper.error("Invalid or expired token", 400),
      { status: 400 }
    );
  }
}
