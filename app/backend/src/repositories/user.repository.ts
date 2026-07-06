import { User, IUser } from "../models/user.model";
import { RegisterInput } from "../types/user.type";


const userModel = User as unknown as {
  find: (q: Record<string, unknown>) => { exec: () => Promise<IUser[]> };
  findOne: (q: Record<string, unknown>) => { exec: () => Promise<IUser | null> };
  findById: (id: string) => { exec: () => Promise<IUser | null> };
  findByIdAndUpdate: (id: string, update: Record<string, unknown>, opts: { returnDocument?: string; new?: boolean }) => { exec: () => Promise<IUser | null> };
};

type UpdateProfileData = {
  full_name?: string;
  email?: string;
  phone?: string;
  vehicle_number?: string;
  vehicle_type?: "Bike" | "Car" | "Truck";
  profileImageUrl?: string | null;
};

export class UserRepository {
  async create(data: Omit<RegisterInput, "confirmPassword"> & { password: string }): Promise<IUser> {
    return User.create(data as any);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return userModel.findOne({ email } as Record<string, unknown>).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return userModel.findById(id).exec();
  }

  async listAll(): Promise<IUser[]> {
    return userModel.find({}).exec();
  }

  async updateProfileImage(id: string, profileImageUrl: string | null): Promise<IUser | null> {
    return userModel.findByIdAndUpdate(id, { profileImageUrl }, { returnDocument: "after" }).exec();
  }

  async updateProfile(id: string, data: UpdateProfileData): Promise<IUser | null> {
    const updateData: Record<string, unknown> = {};

    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.vehicle_number !== undefined) updateData.vehicle_number = data.vehicle_number;
    if (data.vehicle_type !== undefined) updateData.vehicle_type = data.vehicle_type;
    if (data.profileImageUrl !== undefined) updateData.profileImageUrl = data.profileImageUrl;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return userModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" }).exec();
  }

  async updatePassword(id: string, password: string): Promise<IUser | null> {
    return userModel.findByIdAndUpdate(id, { password }, { returnDocument: "after" }).exec();
  }
}