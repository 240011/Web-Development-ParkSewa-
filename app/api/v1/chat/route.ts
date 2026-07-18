import { NextRequest } from "next/server";
import { chatRoute } from "../../../backend/src/routes/chat.route";

export async function POST(request: NextRequest) {
  return chatRoute(request);
}
