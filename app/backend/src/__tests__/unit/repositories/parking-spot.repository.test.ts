import { describe, expect, test, beforeEach } from "@jest/globals";
import { ParkingSpotRepository } from "../../../repositories/parking-spot.repository";
import { ParkingSpot } from "../../../models/parking-spot.model";
import { clearDatabase } from "../../db-helper";

describe(
    "Unit: ParkingSpotRepository",
    () => {
        const parkingSpotRepository = new ParkingSpotRepository();

        beforeEach(async () => {
            await clearDatabase();
        });

        const spotData = {
            name: "Civil Mall Parking",
            address: "New Road, Kathmandu",
            location: "Kathmandu",
            latitude: 27.7,
            longitude: 85.3,
            totalSlots: 20,
            pricePerHour: 60,
            vehicleTypes: ["Car", "Bike"],
        };

        test("should create a parking spot with defaults", async () => {
            const spot = await parkingSpotRepository.create(spotData);
            expect(spot).toHaveProperty("_id");
            expect(spot.name).toBe(spotData.name);
            expect(spot.status).toBe("active");
            expect(spot.availableSlots).toBe(spotData.totalSlots);
            expect(spot.carPrice).toBe(60);
            expect(spot.bikePrice).toBe(40);
        });

        test("should list all parking spots sorted by createdAt desc", async () => {
            await parkingSpotRepository.create(spotData);
            await parkingSpotRepository.create({ ...spotData, name: "Second Spot" });
            const list = await parkingSpotRepository.list();
            expect(list).toHaveLength(2);
            expect(list[0].name).toBe("Second Spot");
        });

        test("should filter by status", async () => {
            await parkingSpotRepository.create({ ...spotData, status: "active" });
            await parkingSpotRepository.create({ ...spotData, status: "inactive" });
            const active = await parkingSpotRepository.list({ status: "active" });
            const inactive = await parkingSpotRepository.list({ status: "inactive" });
            expect(active.every((s) => s.status === "active")).toBe(true);
            expect(inactive.every((s) => s.status === "inactive")).toBe(true);
        });

        test("should filter by vehicle type", async () => {
            await parkingSpotRepository.create({ ...spotData, vehicleTypes: ["Car"] });
            await parkingSpotRepository.create({ ...spotData, vehicleTypes: ["Bike"] });
            const cars = await parkingSpotRepository.list({ vehicleType: "Car" });
            expect(cars).toHaveLength(1);
            expect(cars[0].vehicleTypes).toContain("Car");
        });

        test("should find a spot by id", async () => {
            const created = await parkingSpotRepository.create(spotData);
            const found = await parkingSpotRepository.findById(String(created._id));
            expect(found).not.toBeNull();
            expect(found?.name).toBe(spotData.name);
        });

        test("should update a parking spot", async () => {
            const created = await parkingSpotRepository.create(spotData);
            const updated = await parkingSpotRepository.update(String(created._id), {
                name: "Updated Spot",
                pricePerHour: 80,
            });
            expect(updated?.name).toBe("Updated Spot");
            expect(updated?.pricePerHour).toBe(80);
        });

        test("should return null when updating a non-existent spot", async () => {
            const updated = await parkingSpotRepository.update("64b2f0c2c2a4f0d2b8b6e2a1", {
                name: "Nope",
            });
            expect(updated).toBeNull();
        });

        test("should delete a parking spot", async () => {
            const created = await parkingSpotRepository.create(spotData);
            const deleted = await parkingSpotRepository.delete(String(created._id));
            expect(deleted).not.toBeNull();
            const after = await parkingSpotRepository.findById(String(created._id));
            expect(after).toBeNull();
        });
    }
);
