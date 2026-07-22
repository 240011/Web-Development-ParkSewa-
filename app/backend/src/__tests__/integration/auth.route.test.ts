import express from "express";
import { NextRequest, type NextResponse } from "next/server";
import request from "supertest";
import { Server } from "http";
import { registerRoute, loginRoute } from "../../routes/auth.route";
import { User } from "../../models/user.model";
import "jest";

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
    "Integration: Auth Routes",
    () => {
        let server: Server;

        beforeAll(async () => {
            const app = express();
            app.use(express.json());

            app.post("/api/v1/auth/register", (req, res) => handle(registerRoute, req, res));
            app.post("/api/v1/auth/login", (req, res) => handle(loginRoute, req, res));

            server = app.listen(0);
        });

        afterAll(async () => {
            if (server) await new Promise<void>((r) => server.close(() => r()));
        });

        beforeEach(async () => {
            await User.deleteMany({});
        });

        describe(
            "POST /api/v1/auth/register",
            () => {
                test(
                    "should reject invalid user data with 400",
                    async () => {
                        const res = await request(server)
                            .post("/api/v1/auth/register")
                            .send({
                                firstName: "Mero",
                                lastName: "Namm",
                            });
                        expect(res.statusCode).toBe(400);
                        expect(res.body.success).toBe(false);
                    }
                );

                test(
                    "should register a valid user with 201",
                    async () => {
                        const res = await request(server)
                            .post("/api/v1/auth/register")
                            .send({
                                full_name: "Mero Namm",
                                email: "mero@gmail.com",
                                phone: "9800000000",
                                password: "password123",
                                confirmPassword: "password123",
                                vehicle_number: "BA 1 JA 1234",
                                vehicle_type: "Car",
                            });
                        expect(res.statusCode).toBe(201);
                        expect(res.body.success).toBe(true);
                        expect(res.body.data.email).toBe("mero@gmail.com");
                        expect(res.body.data.token).toBeDefined();
                    }
                );

                test(
                    "should reject duplicate email with 409",
                    async () => {
                        const payload = {
                            full_name: "Mero Namm",
                            email: "mero@gmail.com",
                            phone: "9800000000",
                            password: "password123",
                            confirmPassword: "password123",
                            vehicle_number: "BA 1 JA 1234",
                            vehicle_type: "Car",
                        };
                        await request(server).post("/api/v1/auth/register").send(payload);
                        const res = await request(server).post("/api/v1/auth/register").send(payload);
                        expect(res.statusCode).toBe(409);
                        expect(res.body.success).toBe(false);
                    }
                );
            }
        );

        describe(
            "POST /api/v1/auth/login",
            () => {
                test(
                    "should reject login with missing fields",
                    async () => {
                        const res = await request(server)
                            .post("/api/v1/auth/login")
                            .send({ email: "mero@gmail.com" });
                        expect(res.statusCode).toBe(401);
                        expect(res.body.success).toBe(false);
                    }
                );

                test(
                    "should login a registered user with 200",
                    async () => {
                        await request(server)
                            .post("/api/v1/auth/register")
                            .send({
                                full_name: "Mero Namm",
                                email: "mero@gmail.com",
                                phone: "9800000000",
                                password: "password123",
                                confirmPassword: "password123",
                                vehicle_number: "BA 1 JA 1234",
                                vehicle_type: "Car",
                            });

                        const res = await request(server)
                            .post("/api/v1/auth/login")
                            .send({
                                email: "mero@gmail.com",
                                password: "password123",
                            });
                        expect(res.statusCode).toBe(200);
                        expect(res.body.success).toBe(true);
                        expect(res.body.data.token).toBeDefined();
                    }
                );

                test(
                    "should reject login with wrong password",
                    async () => {
                        await request(server)
                            .post("/api/v1/auth/register")
                            .send({
                                full_name: "Mero Namm",
                                email: "mero@gmail.com",
                                phone: "9800000000",
                                password: "password123",
                                confirmPassword: "password123",
                                vehicle_number: "BA 1 JA 1234",
                                vehicle_type: "Car",
                            });

                        const res = await request(server)
                            .post("/api/v1/auth/login")
                            .send({
                                email: "mero@gmail.com",
                                password: "wrongpassword",
                            });
                        expect(res.statusCode).toBe(401);
                        expect(res.body.success).toBe(false);
                    }
                );
            }
        );
    }
);
