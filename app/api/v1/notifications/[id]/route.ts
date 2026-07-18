import { NextRequest } from "next/server";
import { deleteNotificationRoute } from "../../../../backend/src/routes/notification.route";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return deleteNotificationRoute(request, id);
}
