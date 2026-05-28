import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { RegisterInput, LoginInput } from "../types/user.type";
import { IUser } from "../models/user.model";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterInput): Promise<IUser> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async login(data: LoginInput): Promise<{ user: IUser; token: string }> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    const secretKey = process.env.SECRET_KEY || "default-secret-key";
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      secretKey,
      { expiresIn: "30d" }
    );

    return { user, token };
  }
}