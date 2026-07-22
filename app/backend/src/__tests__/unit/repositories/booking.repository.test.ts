import { describe, expect, test, beforeEach } from "@jest/globals";
import { BookingRepository } from "../../../repositories/booking.repository";
import { Booking } from "../../../models/booking.model";
import { UserRepository } from "../../../repositories/user.repository";
import { User } from "../../../models/user.model";
import { clearDatabase } from "../../db-helper";

describe(
    "Unit: BookingRepository",
    () => {
        const bookingRepository = new BookingRepository();
        let userId: string;
        let spotId: string;

        beforeEach(async () => {
            await clearDatabase();

            const user = await new UserRepository().create({
                full_name: "Booking User",
                email: "bookinguser@gmail.com",
                phone: "9800000001",
                password: "hashedpassword123",
                vehicle_number: "BA 1 JA 9999",
                vehicle_type: "Car",
            });
            userId = String(user._id);
            const spot = await new (require("../../../models/parking-spot.model").ParkingSpot)({
                name: "Test Spot",
                address: "Test Address",
                location: "Test Location",
                totalSlots: 10,
                availableSlots: 10,
                pricePerHour: 60,
                vehicleTypes: ["Car"],
            }).save();
            spotId = String(spot._id);
        });

        test("should create a booking", async () => {
            const booking = await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                vehicleType: "Car",
                startTime: new Date(),
                totalAmount: 120,
                status: "pending",
            });
            expect(booking).toHaveProperty("_id");
            expect(booking.vehicleNumber).toBe("BA 1 JA 1234");
            expect(booking.status).toBe("pending");
        });

        test("should default status to active when not provided", async () => {
            const booking = await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                startTime: new Date(),
                totalAmount: 120,
            });
            expect(booking.status).toBe("active");
        });

        test("should find a booking by id", async () => {
            const created = await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                startTime: new Date(),
                totalAmount: 120,
            });
            const found = await bookingRepository.findById(String(created._id));
            expect(found).not.toBeNull();
            expect(String(found?._id)).toBe(String(created._id));
        });

        test("should list bookings by user id", async () => {
            await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                startTime: new Date(),
                totalAmount: 120,
            });
            const list = await bookingRepository.listByUserId(userId);
            expect(list).toHaveLength(1);
            expect(String(list[0].user)).toBe(userId);
        });

        test("should update a booking", async () => {
            const created = await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                startTime: new Date(),
                totalAmount: 120,
            });
            const updated = await bookingRepository.update(String(created._id), {
                vehicleNumber: "BA 2 JA 5678",
                totalAmount: 200,
                status: "completed",
            });
            expect(updated?.vehicleNumber).toBe("BA 2 JA 5678");
            expect(updated?.totalAmount).toBe(200);
            expect(updated?.status).toBe("completed");
        });

        test("should delete a booking", async () => {
            const created = await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                startTime: new Date(),
                totalAmount: 120,
            });
            const deleted = await bookingRepository.delete(String(created._id));
            expect(deleted).not.toBeNull();
            const after = await bookingRepository.findById(String(created._id));
            expect(after).toBeNull();
        });

        test("should list all bookings", async () => {
            await bookingRepository.create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1234",
                startTime: new Date(),
                totalAmount: 120,
            });
            const all = await bookingRepository.listAll();
            expect(all.length).toBeGreaterThanOrEqual(1);
        });
    }
);
