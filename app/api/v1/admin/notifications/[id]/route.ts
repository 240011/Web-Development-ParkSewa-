import { NextRequest } from "next/server";
import { adminDeleteNotificationRoute } from "../../../../../backend/src/routes/notification.route";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return adminDeleteNotificationRoute(request, id);
}
