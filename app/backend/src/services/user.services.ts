import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { signToken } from "../configs/auth";
import { JWT_SECRET } from "../configs/auth";
import { CLIENT_URL } from "../constants/constant";
import { sendEmail } from "../configs/email";
import { UserRepository } from "../repositories/user.repository";
import { RegisterInput, LoginInput, ChangePasswordInput } from "../types/user.type";
import { IUser } from "../models/user.model";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private generateToken(user: Pick<IUser, "_id" | "email" | "role">) {
    return signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });
  }

  async register(data: RegisterInput): Promise<{ user: IUser; token: string }> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const { confirmPassword: _confirmPassword, ...userData } = data;
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return { user, token: this.generateToken(user) };
  }

  async login(data: LoginInput): Promise<{ user: IUser; token: string }> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.password) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    return { user, token: this.generateToken(user) };
  }

  async changePassword(userId: string, data: ChangePasswordInput): Promise<IUser> {
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

  async sendResetPasswordEmail(email: string): Promise<void> {
    if (!email) {
      return;
    }
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return;
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    const resetLink = `${CLIENT_URL}/frontend/reset_password?token=${token}`;
    const html = `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`;
    try {
      await sendEmail(user.email, 'Password Reset', html);
    } catch (emailError: unknown) {
      console.error("Failed to send reset email:", emailError);
      throw new Error("Failed to send reset email");
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<IUser> {
    try {
      if (!token || !newPassword) {
        throw new Error("Token and new password are required");
      }
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const userId = decoded.id;
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await this.userRepository.updatePassword(userId, hashedPassword);
      if (!updatedUser) {
        throw new Error("Failed to update password");
      }
      return updatedUser;
    } catch {
      throw new Error("Invalid or expired token");
    }
  }
}