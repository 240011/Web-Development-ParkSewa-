import { NextRequest } from "next/server";
import { ChatController } from "../controllers/chat.controller";

const chatController = new ChatController();

export async function chatRoute(request: NextRequest) {
  return chatController.chat(request);
}
