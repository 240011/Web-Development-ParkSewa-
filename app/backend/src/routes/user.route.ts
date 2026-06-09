import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { UserController } from "../controllers/user.controller";
import { cookies } from "next/headers";

const controller = new UserController();

export async function getCurrentUserRoute(request: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, statusCode: 401, message: "Unauthorized - No token provided", data: null },
      { status: 401 }
    );
  }
  return controller.getCurrentUser(request, token);
}
