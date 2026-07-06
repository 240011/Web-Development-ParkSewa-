import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../configs/database";
import { ApiResponseHelper } from "../helpers/ApiResponseHelper";
import { getTokenFromRequest, verifyToken } from "../configs/auth";
import { NotificationRepository } from "../repositories/notification.repository";
import { NotificationService } from "../services/notification.services";
import { UserRepository } from "../repositories/user.repository";
import { z } from "zod";

const notificationRepository = new NotificationRepository();
const notificationService = new NotificationService();
const userRepository = new UserRepository();

const sendNotificationSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  message: z.string().trim().min(1, "Message is required"),
  type: z.enum(["booking", "payment", "system", "promo"]).default("system"),
  target: z.enum(["all", "specific"]).default("all"),
  userIds: z.array(z.string()).optional(),
});

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const statusCode = message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("token") ? 401 : 500;
    return NextResponse.json(
      ApiResponseHelper.error(message, statusCode),
      { status: statusCode }
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
    const { notificationId } = body || {};

    if (notificationId) {
      await notificationRepository.markAsRead(notificationId);
      return NextResponse.json(
        ApiResponseHelper.success(null, "Notification marked as read", 200),
        { status: 200 }
      );
    }

    await notificationRepository.markAllAsRead(payload.userId);
    return NextResponse.json(
      ApiResponseHelper.success(null, "All notifications marked as read", 200),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mark notification as read";
    return NextResponse.json(
      ApiResponseHelper.error(message, 500),
      { status: 500 }
    );
  }
}

export async function deleteNotificationRoute(request: NextRequest, id: string) {
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

    const notification = await notificationRepository.findById(id);
    if (!notification) {
      return NextResponse.json(
        ApiResponseHelper.error("Notification not found", 404),
        { status: 404 }
      );
    }

    if (String(notification.user) !== payload.userId) {
      return NextResponse.json(
        ApiResponseHelper.error("Forbidden", 403),
        { status: 403 }
      );
    }

    await notificationRepository.delete(id);
    return NextResponse.json(
      ApiResponseHelper.success(null, "Notification deleted successfully", 200),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      ApiResponseHelper.error("Failed to delete notification", 500),
      { status: 500 }
    );
  }
}

export async function adminListNotificationsRoute(request: NextRequest) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const notifications = await notificationRepository.listAll();

    return NextResponse.json(
      ApiResponseHelper.success(
        notifications.map((n) => ({
          id: String(n._id),
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          relatedId: n.relatedId ? String(n.relatedId) : undefined,
          userId: String(n.user),
          userName: (n.user as unknown as { full_name?: string; email?: string })?.full_name || (n.user as unknown as { email?: string })?.email || "Unknown",
          createdAt: n.createdAt?.toISOString(),
        })),
        "Notifications retrieved successfully",
        200
      ),
      { status: 200 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function adminSendNotificationRoute(request: NextRequest) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = sendNotificationSchema.parse(body);

    if (validatedData.target === "all") {
      const count = await notificationService.broadcast({
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
      });
      return NextResponse.json(
        ApiResponseHelper.success({ count }, `Notification sent to ${count} users`, 201),
        { status: 201 }
      );
    }

    if (!validatedData.userIds || validatedData.userIds.length === 0) {
      return NextResponse.json(ApiResponseHelper.error("userIds required for specific target", 400), { status: 400 });
    }

    const count = await notificationService.sendToUsers(validatedData.userIds, {
      title: validatedData.title,
      message: validatedData.message,
      type: validatedData.type,
    });

    return NextResponse.json(
      ApiResponseHelper.success({ count }, `Notification sent to ${count} users`, 201),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const issues = error as { issues: Array<{ path: (string | number)[]; message: string }> };
      const message = issues.issues.map((e) => `${e.path.join(".") || "field"}: ${e.message}`).join(", ");
      return NextResponse.json(ApiResponseHelper.error(message, 400), { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to send notification";
    return NextResponse.json(ApiResponseHelper.error(message, 500), { status: 500 });
  }
}

export async function adminDeleteNotificationRoute(request: NextRequest, id: string) {
  await connectDB();

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(ApiResponseHelper.error("Unauthorized", 401), { status: 401 });
  }

  try {
    const payload = verifyToken<{ role?: string }>(token);
    if (payload.role !== "admin") {
      return NextResponse.json(ApiResponseHelper.error("Forbidden", 403), { status: 403 });
    }
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Invalid token", 401), { status: 401 });
  }

  try {
    const notification = await notificationRepository.findById(id);
    if (!notification) {
      return NextResponse.json(ApiResponseHelper.error("Notification not found", 404), { status: 404 });
    }

    await notificationRepository.delete(id);
    return NextResponse.json(
      ApiResponseHelper.success(null, "Notification deleted successfully", 200),
      { status: 200 }
    );
  } catch {
    return NextResponse.json(ApiResponseHelper.error("Failed to delete notification", 500), { status: 500 });
  }
}