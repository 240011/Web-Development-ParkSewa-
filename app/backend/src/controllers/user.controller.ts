import { NextRequest, NextResponse } from "next/server";
import { UserService } from "../services/user.services";
import { LoginDTO } from "../dtos/user.dto";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";

const userService = new UserService();

export class UserController {
  async login(req: NextRequest) {
    try {
      const body = await req.json();
      const validatedData = LoginDTO.validate(body);
      const { user, token } = await userService.login(validatedData);

      return NextResponse.json(
        ApiResponseHelper.success(
          { token, user: { _id: user._id, full_name: user.full_name, email: user.email, phone: user.phone, vehicle_number: user.vehicle_number, vehicle_type: user.vehicle_type, profile_image_url: user.profileImageUrl ?? null } },
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
      // Support both cookie token and Authorization header
      let authToken = token;
      if (!authToken) {
        const authHeader = req.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          authToken = authHeader.substring(7);
        }
      }
      
      if (!authToken) {
        return NextResponse.json(
          ApiResponseHelper.error("Unauthorized - No token provided", 401),
          { status: 401 }
        );
      }
      const jwt = await import("jsonwebtoken");
      const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";
      const payload = jwt.verify(authToken, JWT_SECRET) as { userId: string; email: string; role: string };

      const user = await new (await import("../repositories/user.repository")).UserRepository().findById(payload.userId);

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
            role: user.role
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