import { describe, expect, test, beforeEach } from "@jest/globals";
import { NotificationRepository } from "../../../repositories/notification.repository";
import { Notification } from "../../../models/notification.model";
import { UserRepository } from "../../../repositories/user.repository";
import { User } from "../../../models/user.model";
import { clearDatabase } from "../../db-helper";

describe(
    "Unit: NotificationRepository",
    () => {
        const notificationRepository = new NotificationRepository();
        let userId: string;

        beforeEach(async () => {
            await clearDatabase();
            const user = await new UserRepository().create({
                full_name: "Notify User",
                email: "notifyuser@gmail.com",
                phone: "9800000002",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 8888",
                vehicle_type: "Car",
            });
            userId = String(user._id);
        });

        test("should create a notification", async () => {
            const notification = await notificationRepository.create({
                userId,
                title: "Test Title",
                message: "Test message",
                type: "system",
            });
            expect(notification).toHaveProperty("_id");
            expect(notification.title).toBe("Test Title");
            expect(notification.isRead).toBe(false);
        });

        test("should create notifications for multiple users", async () => {
            const others = await new UserRepository().create({
                full_name: "Other User",
                email: "otheruser@gmail.com",
                phone: "9800000003",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 7777",
                vehicle_type: "Bike",
            });
            const result = await notificationRepository.createForUsers(
                [userId, String(others._id)],
                { title: "Broadcast", message: "Hello", type: "promo" }
            );
            expect(result).toHaveLength(2);
        });

        test("should list notifications by user id, newest first", async () => {
            await notificationRepository.create({ userId, title: "First", message: "m", type: "system" });
            await notificationRepository.create({ userId, title: "Second", message: "m", type: "system" });
            const list = await notificationRepository.listByUserId(userId);
            expect(list).toHaveLength(2);
            expect(list[0].title).toBe("Second");
        });

        test("should mark a notification as read", async () => {
            const created = await notificationRepository.create({ userId, title: "Read", message: "m", type: "system" });
            const updated = await notificationRepository.markAsRead(String(created._id));
            expect(updated?.isRead).toBe(true);
        });

        test("should mark a notification as unread", async () => {
            const created = await notificationRepository.create({ userId, title: "Unread", message: "m", type: "system" });
            await notificationRepository.markAsRead(String(created._id));
            const updated = await notificationRepository.markAsUnread(String(created._id));
            expect(updated?.isRead).toBe(false);
        });

        test("should mark all as read for a user", async () => {
            await notificationRepository.create({ userId, title: "A", message: "m", type: "system" });
            await notificationRepository.create({ userId, title: "B", message: "m", type: "system" });
            await notificationRepository.markAllAsRead(userId);
            const list = await notificationRepository.listByUserId(userId);
            expect(list.every((n) => n.isRead)).toBe(true);
        });

        test("should delete a notification", async () => {
            const created = await notificationRepository.create({ userId, title: "Del", message: "m", type: "system" });
            const deleted = await notificationRepository.delete(String(created._id));
            expect(deleted).not.toBeNull();
            const after = await notificationRepository.findById(String(created._id));
            expect(after).toBeNull();
        });
    }
);
