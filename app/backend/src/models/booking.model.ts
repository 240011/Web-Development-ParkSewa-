import mongoose, { Schema, Document } from "mongoose";

export type BookingStatus = "active" | "pending" | "completed" | "cancelled";

export interface IBooking extends Document {
  user: mongoose.Types.ObjectId;
  spot: mongoose.Types.ObjectId;
  vehicleNumber: string;
  vehicleType?: string;
  startTime: Date;
  endTime?: Date;
  totalAmount: number;
  status: BookingStatus;
  promoCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    spot: { type: Schema.Types.ObjectId, ref: "ParkingSpot", required: true },
    vehicleNumber: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: ["Bike", "Car", "Truck"] },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["active", "pending", "completed", "cancelled"], default: "active" },
    promoCode: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true }
);

export const Booking = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);