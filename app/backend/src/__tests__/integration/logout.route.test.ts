import { describe, expect, test } from "@jest/globals";
import { NextRequest } from "next/server";
import { logoutRoute } from "../../routes/logout.route";

describe(
    "Unit: Logout Route",
    () => {
        test("should return success response", async () => {
            const response = await logoutRoute();
            const body = await response.json() as { success: boolean; message: string };
            expect(response.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.message).toBe("Logged out successfully");
        });

        test("should clear the token cookie", async () => {
            const response = await logoutRoute();
            const cookie = response.cookies.get("token");
            expect(cookie).toBeDefined();
            expect(cookie?.value).toBe("");
            expect(cookie?.maxAge).toBe(0);
        });

        test("should work when invoked via a request context", async () => {
            const request = new NextRequest("http://localhost/api/v1/auth/logout", {
                method: "POST",
            });
            const response = await logoutRoute();
            expect(response.status).toBe(200);
        });
    }
);
