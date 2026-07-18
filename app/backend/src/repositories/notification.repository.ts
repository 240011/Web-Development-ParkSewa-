import { Notification } from "../models/notification.model";

export class NotificationRepository {
  async listByUserId(userId: string) {
    return Notification.find({ user: userId }).sort({ createdAt: -1 });
  }

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: "booking" | "payment" | "system" | "promo";
    relatedId?: string;
  }) {
    return Notification.create({
      user: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      relatedId: data.relatedId,
    });
  }

  async markAsRead(id: string) {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { returnDocument: "after" });
  }

  async markAllAsRead(userId: string) {
    return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }

  async delete(id: string) {
    return Notification.findByIdAndDelete(id);
  }
}