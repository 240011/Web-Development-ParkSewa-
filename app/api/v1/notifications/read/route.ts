import { NextRequest } from "next/server";
import { markNotificationReadRoute } from "../../../backend/src/routes/notification.route";

export async function POST(request: NextRequest) {
  return markNotificationReadRoute(request);
}