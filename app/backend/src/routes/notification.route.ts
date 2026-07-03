import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "../configs/auth";
import { NotificationRepository } from "../repositories/notification.repository";

const notificationRepository = new NotificationRepository();

export async function getNotificationsRoute(request: NextRequest) {
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

    const notifications = await notificationRepository.listByUserId(payload.userId);

    return NextResponse.json(
      ApiResponseHelper.success(
        notifications.map((n) => ({
          id: String(n._id),
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          relatedId: n.relatedId ? String(n.relatedId) : undefined,
          createdAt: n.createdAt?.toISOString(),
        })),
        "Notifications retrieved successfully",
        200
      ),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized", 401),
      { status: 401 }
    );
  }
}

export async function markNotificationReadRoute(request: NextRequest) {
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

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        ApiResponseHelper.error("Notification ID required", 400),
        { status: 400 }
      );
    }

    await notificationRepository.markAsRead(notificationId);

    return NextResponse.json(
      ApiResponseHelper.success(null, "Notification marked as read", 200),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      ApiResponseHelper.error("Unauthorized", 401),
      { status: 401 }
    );
  }
}