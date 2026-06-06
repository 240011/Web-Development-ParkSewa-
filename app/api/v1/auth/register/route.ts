import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../backend/src/configs/database";
import { RegisterDTO } from "../../../../backend/src/dtos/user.dto";
import { UserService } from "../../../../backend/src/services/user.services";

const userService = new UserService();

export async function POST(request: NextRequest) {
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