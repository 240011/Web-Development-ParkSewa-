import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { UserController } from "../controllers/user.controller";
import { cookies } from "next/headers";

const controller = new UserController();

export async function getCurrentUserRoute(request: NextRequest) {
  await connectDB();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  return controller.getCurrentUser(request, token);
}
