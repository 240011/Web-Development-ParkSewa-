import { NextRequest } from "next/server";
import { connectDB } from "../../../../backend/src/configs/database";
import { UserController } from "../../../../backend/src/controllers/user.controller";

const controller = new UserController();

export async function POST(request: NextRequest) {
  await connectDB();
  return controller.register(request);
}