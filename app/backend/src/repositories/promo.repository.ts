import { Promo } from "../models/promo.model";

export class PromoRepository {
  async list(status?: "active" | "inactive") {
    const query: Record<string, unknown> = {};
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    return Promo.find(query).sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return Promo.findById(id);
  }

  async findByCode(code: string) {
    return Promo.findOne({ code: code.toUpperCase() });
  }

  async create(data: {
    code: string;
    description?: string;
    discountType: "percentage" | "fixed";
    value: number;
    expiryDate: Date;
    usageLimit?: number;
    minBookingAmount?: number;
    isActive?: boolean;
  }) {
    return Promo.create({
      ...data,
      usageLimit: data.usageLimit ?? 100,
      usageCount: 0,
      minBookingAmount: data.minBookingAmount ?? 0,
      isActive: data.isActive ?? true,
    });
  }

  async findByIdAndUpdate(id: string, data: Record<string, unknown>) {
    return Promo.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }

  async update(id: string, data: Record<string, unknown>) {
    return Promo.findByIdAndUpdate(id, data, { returnDocument: "after" });
  }

  async delete(id: string) {
    return Promo.findByIdAndDelete(id);
  }

  async incrementUsage(id: string) {
    return Promo.findByIdAndUpdate(id, { $inc: { usageCount: 1 } }, { returnDocument: "after" });
  }
}
