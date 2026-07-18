import { NextRequest } from "next/server";
import { getNotificationsRoute } from "../../../backend/src/routes/notification.route";

export async function GET(request: NextRequest) {
  return getNotificationsRoute(request);
}