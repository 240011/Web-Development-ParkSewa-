import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { RegisterDTO } from "../dtos/user.dto";
import { LoginDTO } from "../dtos/user.dto";
import { UserService } from "../services/user.services";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";

const userService = new UserService();

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
  await connectDB();

  try {
    const body = await request.json();
    const validatedData = LoginDTO.validate(body);
    const { user, token } = await userService.login(validatedData);

    const response = NextResponse.json(
      ApiResponseHelper.success(
        { token, user: { _id: user._id, full_name: user.full_name, email: user.email, phone: user.phone, vehicle_number: user.vehicle_number, vehicle_type: user.vehicle_type } },
        "Login successful",
        200
      ),
      { status: 200 }
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
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json(
      ApiResponseHelper.error(message, 401),
      { status: 401 }
    );
  }
}
