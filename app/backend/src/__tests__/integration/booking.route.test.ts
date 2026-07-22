import { describe, expect, test, beforeAll, afterAll, beforeEach } from "@jest/globals";
import express from "express";
import { NextRequest, type NextResponse } from "next/server";
import request from "supertest";
import { Server } from "http";
import * as jwt from "jsonwebtoken";
import { BookingRepository } from "../../repositories/booking.repository";
import { ParkingSpot } from "../../models/parking-spot.model";
import { UserRepository } from "../../repositories/user.repository";
import { User } from "../../models/user.model";
import { getBookingsRoute, createBookingRoute } from "../../routes/booking.route";
import { signToken, JWT_SECRET } from "../../configs/auth";
import { clearDatabase } from "../db-helper";

function toNextRequest(req: express.Request): NextRequest {
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const init = {
        method: req.method,
        headers: req.headers as Record<string, string>,
    } as any;
    if (req.method !== "GET" && req.method !== "HEAD") {
        init.body = JSON.stringify(req.body);
    }
    return new NextRequest(url, init) as NextRequest;
}

async function handle(handler: (req: NextRequest) => Promise<NextResponse>, req: express.Request, res: express.Response) {
    const nextRes = await handler(toNextRequest(req));
    res.status(nextRes.status);
    nextRes.headers.forEach((value, key) => res.setHeader(key, value));
    const body = await nextRes.text();
    if (body) {
        res.setHeader("content-type", "application/json");
        res.send(body);
    } else {
        res.end();
    }
}

describe(
    "Integration: Booking Routes",
    () => {
        let server: Server;
        let userId: string;
        let authToken: string;
        let spotId: string;

        const userData = {
            full_name: "Booking Route User",
            email: "bookingroute@gmail.com",
            phone: "9800000011",
            password: "password123",
            confirmPassword: "password123",
            vehicle_number: "BA 1 JA 1212",
            vehicle_type: "Car" as const,
        };

        beforeAll(async () => {
            const app = express();
            app.use(express.json());
            app.get("/api/v1/bookings", (req, res) => handle(getBookingsRoute, req, res));
            app.post("/api/v1/bookings", (req, res) => handle(createBookingRoute, req, res));
            server = app.listen(0);
        });

        afterAll(async () => {
            if (server) {
                server.closeAllConnections();
                await new Promise<void>((resolve) => {
                    server.close(() => resolve());
                    setTimeout(resolve, 1000);
                });
            }
        });

        beforeEach(async () => {
            await clearDatabase();

            const user = await new UserRepository().create(userData);
            userId = String(user._id);
            authToken = signToken({ userId, email: userData.email, role: "user" });

            const spot = await new ParkingSpot({
                name: "Route Spot",
                address: "Addr",
                location: "Loc",
                totalSlots: 5,
                availableSlots: 5,
                pricePerHour: 60,
                vehicleTypes: ["Car"],
            }).save();
            spotId = String(spot._id);
        });

        const authHeader = () => ({ Authorization: `Bearer ${authToken}` });

        test("should reject GET bookings without auth", async () => {
            const res = await request(server).get("/api/v1/bookings");
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test("should create a booking with auth", async () => {
            const res = await request(server)
                .post("/api/v1/bookings")
                .set(authHeader())
                .send({
                    spotId,
                    vehicleNumber: "BA 1 JA 1212",
                    vehicleType: "Car",
                    startTime: new Date().toISOString(),
                    totalAmount: 120,
                });
            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
        });

        test("should reject booking with missing required fields", async () => {
            const res = await request(server)
                .post("/api/v1/bookings")
                .set(authHeader())
                .send({ vehicleNumber: "BA 1 JA 1212" });
            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
        });

        test("should reject booking for non-existent spot", async () => {
            const res = await request(server)
                .post("/api/v1/bookings")
                .set(authHeader())
                .send({
                    spotId: "64b2f0c2c2a4f0d2b8b6e2a1",
                    vehicleNumber: "BA 1 JA 1212",
                    startTime: new Date().toISOString(),
                    totalAmount: 120,
                });
            expect(res.statusCode).toBe(404);
        });

        test("should list the user's bookings after creation", async () => {
            await new BookingRepository().create({
                userId,
                spotId,
                vehicleNumber: "BA 1 JA 1212",
                startTime: new Date(),
                totalAmount: 120,
            });
            const res = await request(server).get("/api/v1/bookings").set(authHeader());
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });

        test("should decrement available slots on booking creation", async () => {
            await request(server)
                .post("/api/v1/bookings")
                .set(authHeader())
                .send({
                    spotId,
                    vehicleNumber: "BA 1 JA 1212",
                    vehicleType: "Car",
                    startTime: new Date().toISOString(),
                    totalAmount: 120,
                });
            const spot = await ParkingSpot.findById(spotId);
            expect(spot?.availableSlots).toBe(4);
        });
    }
);
