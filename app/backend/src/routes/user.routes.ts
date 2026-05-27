import { NextRequest } from "next/server";
import { UserController } from "../controllers/user.controller";

const controller = new UserController();

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.split("/").pop();

  if (path === "register") {
    return controller.register(request);
  }
  if (path === "login") {
    return controller.login(request);
  }

  return new Response("Not Found", { status: 404 });
}