import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DUMMY_ADMIN_ID, DUMMY_ADMIN_USER, isDummyAdminLogin } from "../constants/auth.constants";
import { UserRepository } from "../repositories/user.repository";
import { RegisterInput, LoginInput, ChangePasswordInput } from "../types/user.type";
import { IUser } from "../models/user.model";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "default-secret-key";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private generateToken(user: Pick<IUser, "_id" | "email" | "role">) {
    return jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
  }

  async register(data: RegisterInput): Promise<{ user: IUser; token: string }> {
    if (data.email.toLowerCase() === DUMMY_ADMIN_USER.email.toLowerCase()) {
      throw new Error("User with this email already exists");
    }

    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return { user, token: this.generateToken(user) };
  }

  async login(data: LoginInput): Promise<{ user: IUser; token: string }> {
    if (isDummyAdminLogin(data.email, data.password)) {
      return { user: DUMMY_ADMIN_USER, token: this.generateToken(DUMMY_ADMIN_USER) };
    }

    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    return { user, token: this.generateToken(user) };
  }

  async changePassword(userId: string, data: ChangePasswordInput): Promise<IUser> {
    if (userId === DUMMY_ADMIN_ID) {
      throw new Error("Password cannot be changed for the demo admin account");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    const updatedUser = await this.userRepository.updatePassword(userId, hashedPassword);

    if (!updatedUser) {
      throw new Error("Failed to update password");
    }

    return updatedUser;
  }
}
