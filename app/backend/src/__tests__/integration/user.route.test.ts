import { describe, expect, test, beforeAll, afterAll, beforeEach } from "@jest/globals";
import express from "express";
import { NextRequest, type NextResponse } from "next/server";
import request from "supertest";
import { Server } from "http";
import { UserRepository } from "../../repositories/user.repository";
import { User } from "../../models/user.model";
import { getCurrentUserRoute } from "../../routes/user.route";
import { signToken } from "../../configs/auth";
import { clearDatabase } from "../db-helper";

function toNextRequest(req: express.Request): NextRequest {
    const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const init = {
        method: req.method,
        headers: req.headers as Record<string, string>,
    } as any;
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
    "Integration: User Routes",
    () => {
        let server: Server;
        let userId: string;
        let authToken: string;

        const userData = {
            full_name: "Current User Test",
            email: "currentuser@gmail.com",
            phone: "9800000022",
            password: "password123",
            confirmPassword: "password123",
            vehicle_number: "BA 1 JA 3434",
            vehicle_type: "Car" as const,
        };

        beforeAll(async () => {
            const app = express();
            app.use(express.json());
            app.get("/api/v1/auth/current-user", (req, res) => handle(getCurrentUserRoute, req, res));
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
        });

        const authHeader = () => ({ Authorization: `Bearer ${authToken}` });

        test("should reject request without a token", async () => {
            const res = await request(server).get("/api/v1/auth/current-user");
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        test("should reject request with an invalid token", async () => {
            const res = await request(server)
                .get("/api/v1/auth/current-user")
                .set({ Authorization: "Bearer invalid.token.here" });
            expect(res.statusCode).toBe(401);
        });

        test("should return the current user with a valid token", async () => {
            const res = await request(server)
                .get("/api/v1/auth/current-user")
                .set(authHeader());
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data._id).toBe(userId);
            expect(res.body.data.email).toBe(userData.email);
            expect(res.body.data.full_name).toBe(userData.full_name);
        });

        test("should include role in the returned user", async () => {
            const res = await request(server)
                .get("/api/v1/auth/current-user")
                .set(authHeader());
            expect(res.body.data.role).toBe("user");
        });
    }
);
