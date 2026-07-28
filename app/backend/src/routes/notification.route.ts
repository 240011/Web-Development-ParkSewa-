import { NextRequest } from "next/server";
import { NotificationController } from "../controllers/notification.controller";

const notificationController = new NotificationController();

export async function getNotificationsRoute(request: NextRequest) {
  return notificationController.getNotifications(request);
}

export async function markNotificationReadRoute(request: NextRequest) {
  return notificationController.markNotificationRead(request);
}

export async function deleteNotificationRoute(request: NextRequest, id: string) {
  return notificationController.deleteNotification(request, id);
}

export async function adminListNotificationsRoute(request: NextRequest) {
  return notificationController.adminListNotifications(request);
}

export async function adminSendNotificationRoute(request: NextRequest) {
  return notificationController.adminSendNotification(request);
}

export async function adminDeleteNotificationRoute(request: NextRequest, id: string) {
  return notificationController.adminDeleteNotification(request, id);
}
