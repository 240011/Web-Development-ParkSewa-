import { NextRequest } from "next/server";
import { markNotificationReadRoute } from "@backend/routes/notification.route";

export async function POST(request: NextRequest) {
  return markNotificationReadRoute(request);
}