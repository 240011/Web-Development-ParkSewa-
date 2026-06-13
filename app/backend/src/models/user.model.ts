import mongoose, { Schema, Document } from "mongoose";

export type VehicleType = "Bike" | "Car" | "Truck";

export interface IUser extends Document {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_number: string;
  vehicle_type: VehicleType;
  profileImageUrl?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    vehicle_number: { type: String, required: true, trim: true },
    vehicle_type: { type: String, enum: ["Bike", "Car", "Truck"], required: true },
    profileImageUrl: { type: String, trim: true, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);