import mongoose, { Schema, Document } from "mongoose";

export type VehicleType = "bike" | "car" | "truck" | "covered" | "indoor" | "ev";
export type SpotStatus = "active" | "inactive";

export interface IParkingSpot extends Document {
  name: string;
  address: string;
  location: string;
  latitude?: number;
  longitude?: number;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  bikePrice?: number;
  carPrice?: number;
  truckPrice?: number;
  evPrice?: number;
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
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    totalSlots: { type: Number, required: true, min: 0 },
    availableSlots: { type: Number, required: true, min: 0 },
    pricePerHour: { type: Number, required: true, min: 0 },
    bikePrice: { type: Number, min: 0 },
    carPrice: { type: Number, min: 0 },
    truckPrice: { type: Number, min: 0 },
    evPrice: { type: Number, min: 0 },
    vehicleTypes: { type: [String], required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const ParkingSpot = mongoose.models.ParkingSpot || mongoose.model<IParkingSpot>("ParkingSpot", ParkingSpotSchema);
