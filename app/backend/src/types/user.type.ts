import { z } from "zod";

export const registerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  vehicle_number: z.string().min(1, "Vehicle number is required"),
  vehicle_type: z.enum(["Bike", "Car", "Truck"]),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  licensePlate: z.string().min(1, "License plate is required").optional(),
  vehicleType: z.enum(["Bike", "Car", "Truck"]).optional(),
  profileImageUrl: z.union([
    z.string().regex(/^\/(?:uploads|api\/v1\/uploads\/files)\//, "Profile image must be an uploaded file URL"),
    z.null(),
  ]).optional(),
}).refine((data) => Object.values(data).some((value) => value !== undefined), "At least one profile field is required");

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
