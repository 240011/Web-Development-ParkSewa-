import { NextRequest, NextResponse } from "next/server";
import { UserService } from "../services/user.services";
import { RegisterDTO, LoginDTO } from "../dtos/user.dto";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";

const userService = new UserService();

export class UserController {
  async register(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = RegisterDTO.validate(body);
      const user = await userService.register(validatedData);
      return NextResponse.json(
        ApiResponseHelper.success(
          { _id: user._id, full_name: user.full_name, email: user.email, phone: user.phone, vehicle_number: user.vehicle_number, vehicle_type: user.vehicle_type },
          "User registered successfully",
          201
        ),
        { status: 201 }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Registration failed";
      return NextResponse.json(
        ApiResponseHelper.error(message, 400),
        { status: 400 }
      );
    }
  }

  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = LoginDTO.validate(body);
      const { user, token } = await userService.login(validatedData);
      return NextResponse.json(
        ApiResponseHelper.success(
          { token, user: { _id: user._id, full_name: user.full_name, email: user.email, phone: user.phone, vehicle_number: user.vehicle_number, vehicle_type: user.vehicle_type } },
          "Login successful",
          200
        )
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      return NextResponse.json(
        ApiResponseHelper.error(message, 401),
        { status: 401 }
      );
    }
  }
}