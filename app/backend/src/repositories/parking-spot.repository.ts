import { ParkingSpot, IParkingSpot, SpotStatus, VehicleType } from "../models/parking-spot.model";

const parkingSpotModel = ParkingSpot as unknown as {
  find: (q: Record<string, unknown>) => { sort: (s: Record<string, 1 | -1>) => { exec: () => Promise<IParkingSpot[]> } };
  findById: (id: string) => { exec: () => Promise<IParkingSpot | null> };
  create: (d: Record<string, unknown>) => Promise<IParkingSpot>;
  findByIdAndUpdate: (id: string, update: Record<string, unknown>, opts: { returnDocument?: string; new?: boolean }) => { exec: () => Promise<IParkingSpot | null> };
  findByIdAndDelete: (id: string) => { exec: () => Promise<IParkingSpot | null> };
};

export type ParkingSpotInput = {
  name: string;
  address: string;
  location: string;
  latitude?: number;
  longitude?: number;
  totalSlots: number;
  pricePerHour: number;
  vehicleTypes: VehicleType[];
  status?: SpotStatus;
  images?: string[];
};

export type ParkingSpotUpdateInput = Partial<ParkingSpotInput>;

export class ParkingSpotRepository {
  async list(status?: SpotStatus): Promise<IParkingSpot[]> {
    const query = status ? { status } : {};
    return parkingSpotModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<IParkingSpot | null> {
    return parkingSpotModel.findById(id).exec();
  }

  async create(data: ParkingSpotInput): Promise<IParkingSpot> {
    return parkingSpotModel.create({
      ...data,
      status: data.status ?? "active",
      images: data.images ?? [],
      availableSlots: data.totalSlots,
      latitude: data.latitude,
      longitude: data.longitude,
    });
  }

  async update(id: string, data: ParkingSpotUpdateInput): Promise<IParkingSpot | null> {
    const existingSpot = await this.findById(id);
    if (!existingSpot) return null;

    const updateData: Record<string, unknown> = {};
    const nextTotalSlots = data.totalSlots ?? existingSpot.totalSlots;
    const nextAvailableSlots = data.totalSlots === undefined
      ? existingSpot.availableSlots
      : Math.max(0, Math.min(nextTotalSlots, existingSpot.availableSlots + Math.max(0, nextTotalSlots - existingSpot.totalSlots)));

    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.totalSlots !== undefined) updateData.totalSlots = nextTotalSlots;
    if (data.pricePerHour !== undefined) updateData.pricePerHour = data.pricePerHour;
    if (data.vehicleTypes !== undefined) updateData.vehicleTypes = data.vehicleTypes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.images !== undefined) updateData.images = data.images;
    updateData.availableSlots = nextAvailableSlots;

    return parkingSpotModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" }).exec();
  }

  async delete(id: string): Promise<IParkingSpot | null> {
    return parkingSpotModel.findByIdAndDelete(id).exec();
  }
}