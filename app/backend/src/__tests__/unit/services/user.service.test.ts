import { describe, expect, test, beforeEach } from "@jest/globals";
import { UserService } from "../../../services/user.services";
import { User } from "../../../models/user.model";
import { clearDatabase } from "../../db-helper";

describe(
    "Unit: UserService",
    () => {
        const userService = new UserService();

        beforeEach(async () => {
            await clearDatabase();
        });

        const validUser = {
            full_name: "Service User",
            email: "serviceuser@gmail.com",
            phone: "9800000004",
            password: "password123",
            confirmPassword: "password123",
            vehicle_number: "BA 1 JA 5555",
            vehicle_type: "Car" as const,
        };

        test("should register a user and hash the password", async () => {
            const { user, token } = await userService.register(validUser);
            expect(user).toHaveProperty("_id");
            expect(user.email).toBe(validUser.email);
            expect(user.password).not.toBe(validUser.password);
            expect(token).toBeDefined();
        });

        test("should throw when registering a duplicate email", async () => {
            await userService.register(validUser);
            await expect(userService.register(validUser)).rejects.toThrow(
                "User with this email already exists"
            );
        });

        test("should login with correct credentials", async () => {
            await userService.register(validUser);
            const { user, token } = await userService.login({
                email: validUser.email,
                password: validUser.password,
            });
            expect(user.email).toBe(validUser.email);
            expect(token).toBeDefined();
        });

        test("should throw on login with wrong password", async () => {
            await userService.register(validUser);
            await expect(
                userService.login({ email: validUser.email, password: "wrongpassword" })
            ).rejects.toThrow("Invalid email or password");
        });

        test("should throw on login with unknown email", async () => {
            await expect(
                userService.login({ email: "nobody@gmail.com", password: "password123" })
            ).rejects.toThrow("Invalid email or password");
        });

        test("should change password with correct current password", async () => {
            const { user } = await userService.register(validUser);
            const updated = await userService.changePassword(String(user._id), {
                currentPassword: "password123",
                newPassword: "newpassword456",
                confirmPassword: "newpassword456",
            });
            expect(updated).not.toBeNull();
            expect(updated.password).not.toBe(validUser.password);
        });

        test("should throw on change password with incorrect current password", async () => {
            const { user } = await userService.register(validUser);
            await expect(
                userService.changePassword(String(user._id), {
                    currentPassword: "wrongpassword",
                    newPassword: "newpassword456",
                    confirmPassword: "newpassword456",
                })
            ).rejects.toThrow("Current password is incorrect");
        });
    }
);
