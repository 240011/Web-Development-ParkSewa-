import mongoose, { Schema, Document } from "mongoose";

export type NotificationType = "booking" | "payment" | "system" | "promo";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["booking", "payment", "system", "promo"], required: true },
    isRead: { type: Boolean, required: true, default: false },
    relatedId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

export const Notification = mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);