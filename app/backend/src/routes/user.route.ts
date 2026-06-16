import { NextRequest } from "next/server";
import { connectDB } from "../configs/database";
import { UserController } from "../controllers/user.controller";
import { isDummyAdminToken } from "../constants/auth.constants";

const controller = new UserController();

export async function getCurrentUserRoute(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = request.cookies.get("token")?.value || (authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined);

  if (isDummyAdminToken(token)) {
    return controller.getCurrentUser(request, token);
  }

  await connectDB();
  return controller.getCurrentUser(request, token);
}
