import { User, IUser } from "../models/user.model";
import { RegisterInput } from "../types/user.type";

export class UserRepository {
  async create(data: RegisterInput & { password: string }): Promise<IUser> {
    return User.create(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }
}