import { describe, expect, test, beforeEach } from "@jest/globals";
import { NotificationService } from "../../../services/notification.services";
import { Notification } from "../../../models/notification.model";
import { UserRepository } from "../../../repositories/user.repository";
import { User } from "../../../models/user.model";
import { clearDatabase } from "../../db-helper";

describe(
    "Unit: NotificationService",
    () => {
        const notificationService = new NotificationService();

        beforeEach(async () => {
            await clearDatabase();
        });

        test("should create a booking notification", async () => {
            const user = await new UserRepository().create({
                full_name: "Notif Svc User",
                email: "notifsvc@gmail.com",
                phone: "9800000005",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 4444",
                vehicle_type: "Bike",
            });
            const notification = await notificationService.createBookingNotification(
                String(user._id),
                "64b2f0c2c2a4f0d2b8b6e2a1",
                "City Parking",
                "BA 1 JA 4444",
                new Date("2026-07-18T10:00:00Z")
            );
            expect(notification.title).toBe("Booking Confirmed");
            expect(notification.type).toBe("booking");
            expect(notification.message).toContain("City Parking");
        });

        test("should create a direct notification", async () => {
            const user = await new UserRepository().create({
                full_name: "Direct User",
                email: "direct@gmail.com",
                phone: "9800000006",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 3333",
                vehicle_type: "Truck",
            });
            const notification = await notificationService.create({
                userId: String(user._id),
                title: "Payment",
                message: "Paid",
                type: "payment",
            });
            expect(notification.title).toBe("Payment");
            expect(notification.type).toBe("payment");
        });

        test("should broadcast to all users", async () => {
            await new UserRepository().create({
                full_name: "U1",
                email: "u1@gmail.com",
                phone: "9800000007",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 1111",
                vehicle_type: "Car",
            });
            await new UserRepository().create({
                full_name: "U2",
                email: "u2@gmail.com",
                phone: "9800000008",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 2222",
                vehicle_type: "Bike",
            });
            const result = await notificationService.broadcast({
                title: "Hello all",
                message: "Broadcast",
                type: "system",
            });
            expect(result).toHaveLength(2);
            const all = await Notification.find({});
            expect(all).toHaveLength(2);
        });

        test("should send notifications to specific users", async () => {
            const u1 = await new UserRepository().create({
                full_name: "S1",
                email: "s1@gmail.com",
                phone: "9800000009",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 1010",
                vehicle_type: "Car",
            });
            const result = await notificationService.sendToUsers([String(u1._id)], {
                title: "Hi specific",
                message: "msg",
                type: "promo",
            });
            expect(result).toHaveLength(1);
        });
    }
);
