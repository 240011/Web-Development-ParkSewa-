import { describe, expect, test, beforeEach } from "@jest/globals";
import { UserRepository } from "../../../repositories/user.repository";
import { User } from "../../../models/user.model";
import { clearDatabase } from "../../db-helper";

describe(
    "Unit: UserRepository",
    () => {
        let userRepository = new UserRepository();

        beforeEach(async () => {
            await clearDatabase();
        });

        const userData = {
            full_name: "Mero Namm",
            email: "mero@gmail.com",
            phone: "9800000000",
            password: "password123",
            vehicle_number: "BA 1 JA 1234",
            vehicle_type: "Car" as const,
        };

        test(
            "should create a user",
            async () => {
                const user = await userRepository.create(userData);
                expect(user).toBeDefined();
                expect(user).toHaveProperty("_id");
                expect(user.full_name).toBe(userData.full_name);
                expect(user.email).toBe(userData.email);
            }
        );

        test(
            "should find a user by email",
            async () => {
                await userRepository.create(userData);
                const found = await userRepository.findByEmail(userData.email);
                expect(found).not.toBeNull();
                expect(found?.email).toBe(userData.email);
            }
        );

        test(
            "should return null when finding a non-existent email",
            async () => {
                const found = await userRepository.findByEmail("missing@gmail.com");
                expect(found).toBeNull();
            }
        );

        test(
            "should find a user by id",
            async () => {
                const created = await userRepository.create(userData);
                const found = await userRepository.findById(String(created._id));
                expect(found).not.toBeNull();
                expect(found?._id?.toString()).toBe(created._id.toString());
            }
        );

        test(
            "should list all users",
            async () => {
                await userRepository.create(userData);
                await userRepository.create({ ...userData, email: "other@gmail.com" });
                const all = await userRepository.listAll();
                expect(all).toHaveLength(2);
            }
        );

        test(
            "should update the profile image",
            async () => {
                const created = await userRepository.create(userData);
                const updated = await userRepository.updateProfileImage(
                    String(created._id),
                    "/uploads/profile.png"
                );
                expect(updated?.profileImageUrl).toBe("/uploads/profile.png");
            }
        );

        test(
            "should update profile fields",
            async () => {
                const created = await userRepository.create(userData);
                const updated = await userRepository.updateProfile(String(created._id), {
                    full_name: "Updated Name",
                    phone: "9811111111",
                });
                expect(updated?.full_name).toBe("Updated Name");
                expect(updated?.phone).toBe("9811111111");
            }
        );

        test(
            "should update the password",
            async () => {
                const created = await userRepository.create(userData);
                const updated = await userRepository.updatePassword(
                    String(created._id),
                    "newpassword123"
                );
                expect(updated?.password).toBe("newpassword123");
            }
        );
    }
);
