import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@backend/configs/database";
import { ApiResponseHelper } from "@backend/helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "@backend/configs/auth";
import { NotificationRepository } from "@backend/repositories/notification.repository";

const notificationRepository = new NotificationRepository();

export async function PUT(request: NextRequest) {
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

    await notificationRepository.markAllAsRead(payload.userId);
    return NextResponse.json(
      ApiResponseHelper.success(null, "All notifications marked as read", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mark all notifications as read";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}
