import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/configs/database";
import { ApiResponseHelper } from "@backend/helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "@backend/configs/auth";
import { NotificationRepository } from "@backend/repositories/notification.repository";

const notificationRepository = new NotificationRepository();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized - Please login", 401),
      { status: 401 }
    );
  }

  try {
    const payload = verifyToken<{ userId?: string }>(token);
    if (!payload.userId) {
      return NextResponse.json(
        ApiResponseHelper.error("Unauthorized", 401),
        { status: 401 }
      );
    }

    const { id } = await params;
    const notification = await notificationRepository.markAsUnread(id);

    if (!notification) {
      return NextResponse.json(
        ApiResponseHelper.error("Notification not found", 404),
        { status: 404 }
      );
    }

    return NextResponse.json(
      ApiResponseHelper.success(
        {
          id: String(notification._id),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          isRead: notification.isRead,
          relatedId: notification.relatedId ? String(notification.relatedId) : undefined,
          createdAt: notification.createdAt?.toISOString(),
        },
        "Notification marked as unread",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mark notification as unread";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}
