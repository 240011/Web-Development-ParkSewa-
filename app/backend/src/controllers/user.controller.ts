import { NextRequest, NextResponse } from "next/server";
import { UserService } from "../services/user.services";
import { LoginDTO } from "../dtos/user.dto";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import {
  getTokenFromRequest,
  verifyToken,
} from "../configs/auth";
import { UserRepository } from "../repositories/user.repository";

const userService = new UserService();
const userRepository = new UserRepository();

export class UserController {
  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = LoginDTO.validate(body);
      const { user, token } = await userService.login(validatedData);

      return NextResponse.json(
        ApiResponseHelper.success(
          { token, user: { _id: user._id, full_name: user.full_name, email: user.email, phone: user.phone, vehicle_number: user.vehicle_number, vehicle_type: user.vehicle_type, profile_image_url: user.profileImageUrl ?? null, createdAt: user.createdAt } },
          "Login successful",
          200
        ),
        { status: 200 }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Login failed";
      return NextResponse.json(
        ApiResponseHelper.error(message, 401),
        { status: 401 }
      );
    }
  }

  async getCurrentUser(req: NextRequest, token?: string) {
    try {
      const authToken = token || getTokenFromRequest(req);

      if (!authToken) {
        return NextResponse.json(
          ApiResponseHelper.error("Unauthorized - No token provided", 401),
          { status: 401 }
        );
      }
      const payload = verifyToken<{ userId: string; email: string; role: string }>(authToken);

      const user = await userRepository.findById(payload.userId);

      if (!user) {
        return NextResponse.json(
          ApiResponseHelper.error("User not found", 404),
          { status: 404 }
        );
      }

      return NextResponse.json(
        ApiResponseHelper.success(
          {
            _id: user._id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            vehicle_number: user.vehicle_number,
            vehicle_type: user.vehicle_type,
            profile_image_url: user.profileImageUrl ?? null,
            role: user.role,
            createdAt: user.createdAt,
          },
          "User retrieved successfully",
          200
        ),
        { status: 200 }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to get current user";
      return NextResponse.json(
        ApiResponseHelper.error(message, 401),
        { status: 401 }
      );
    }
  }
}