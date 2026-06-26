import mongoose, { Schema, Document } from "mongoose";

export type VehicleType = "bike" | "car" | "truck";
export type SpotStatus = "active" | "inactive";

export interface IParkingSpot extends Document {
  name: string;
  address: string;
  location: string;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  vehicleTypes: VehicleType[];
  status: SpotStatus;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ParkingSpotSchema = new Schema<IParkingSpot>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    totalSlots: { type: Number, required: true, min: 0 },
    availableSlots: { type: Number, required: true, min: 0 },
    pricePerHour: { type: Number, required: true, min: 0 },
    vehicleTypes: { type: [String], enum: ["bike", "car", "truck"], required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const ParkingSpot = mongoose.models.ParkingSpot || mongoose.model<IParkingSpot>("ParkingSpot", ParkingSpotSchema);
