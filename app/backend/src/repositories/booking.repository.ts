import { Booking, IBooking, BookingStatus } from "../models/booking.model";

const bookingModel = Booking as unknown as {
  find: (q: Record<string, unknown>) => { sort: (s: Record<string, 1 | -1>) => { exec: () => Promise<IBooking[]> } };
  findOne: (q: Record<string, unknown>) => { exec: () => Promise<IBooking | null> };
  findById: (id: string) => { exec: () => Promise<IBooking | null> };
  create: (d: Record<string, unknown>) => Promise<IBooking>;
  findByIdAndUpdate: (id: string, update: Record<string, unknown>, opts: { returnDocument?: string; new?: boolean }) => { exec: () => Promise<IBooking | null> };
  findByIdAndDelete: (id: string) => { exec: () => Promise<IBooking | null> };
};

export type BookingInput = {
  userId: string;
  spotId: string;
  vehicleNumber: string;
  startTime: Date;
  endTime?: Date;
  totalAmount: number;
  status?: BookingStatus;
  promoCode?: string;
};

export class BookingRepository {
  async listByUserId(userId: string): Promise<IBooking[]> {
    return bookingModel.find({ user: userId }).sort({ startTime: -1 }).exec();
  }

  async findById(id: string): Promise<IBooking | null> {
    return bookingModel.findById(id).exec();
  }

  async create(data: BookingInput): Promise<IBooking> {
    return bookingModel.create({
      user: data.userId,
      spot: data.spotId,
      vehicleNumber: data.vehicleNumber,
      startTime: data.startTime,
      endTime: data.endTime,
      totalAmount: data.totalAmount,
      status: data.status ?? "active",
      promoCode: data.promoCode,
    });
  }

  async update(id: string, data: Partial<BookingInput>): Promise<IBooking | null> {
    const updateData: Record<string, unknown> = {};

    if (data.vehicleNumber !== undefined) updateData.vehicleNumber = data.vehicleNumber;
    if (data.startTime !== undefined) updateData.startTime = data.startTime;
    if (data.endTime !== undefined) updateData.endTime = data.endTime;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.status !== undefined) updateData.status = data.status;

    return bookingModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" }).exec();
  }

  async delete(id: string): Promise<IBooking | null> {
    return bookingModel.findByIdAndDelete(id).exec();
  }

  async listAll(): Promise<IBooking[]> {
    return bookingModel.find({}).sort({ startTime: -1 }).exec();
  }
}