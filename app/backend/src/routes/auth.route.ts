import { NextRequest } from "next/server";
import { AuthController } from "../controllers/auth.controller";

const authController = new AuthController();

export async function registerRoute(request: NextRequest) {
  return authController.register(request);
}

export async function loginRoute(request: NextRequest) {
  return authController.login(request);
}

export async function changePasswordRoute(request: NextRequest) {
  return authController.changePassword(request);
}

export async function requestPasswordResetRoute(request: NextRequest) {
  return authController.requestPasswordReset(request);
}

export async function resetPasswordRoute(request: NextRequest, { params }: { params: { token: string } }) {
  return authController.resetPassword(request, params);
}
