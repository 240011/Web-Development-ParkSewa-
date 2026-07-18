import mongoose, { Schema, Document } from "mongoose";

export type PromoStatus = "active" | "inactive";

export interface IPromo extends Document {
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  value: number;
  expiryDate: Date;
  usageLimit: number;
  usageCount: number;
  minBookingAmount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoSchema = new Schema<IPromo>(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true, min: 0 },
    expiryDate: { type: Date, required: true },
    usageLimit: { type: Number, required: true, min: 0, default: 100 },
    usageCount: { type: Number, required: true, min: 0, default: 0 },
    minBookingAmount: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export const Promo = mongoose.models.Promo || mongoose.model<IPromo>("Promo", PromoSchema);
