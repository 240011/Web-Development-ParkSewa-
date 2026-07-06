import { NextRequest } from "next/server";
import { adminListNotificationsRoute, adminSendNotificationRoute } from "../../../../backend/src/routes/notification.route";

export async function GET(request: NextRequest) {
  return adminListNotificationsRoute(request);
}

export async function POST(request: NextRequest) {
  return adminSendNotificationRoute(request);
}
