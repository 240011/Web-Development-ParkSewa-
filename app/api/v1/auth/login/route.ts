import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../backend/src/configs/database";
import { UserService } from "../../../../backend/src/services/user.services";
import { LoginDTO } from "../../../../backend/src/dtos/user.dto";
import { ApiResponseHelper } from "../../../../backend/src/helpers/ApiResponseHelper";

const userService = new UserService();

export async function POST(request: NextRequest) {
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