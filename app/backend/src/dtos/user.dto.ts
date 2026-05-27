import { registerSchema, loginSchema, RegisterInput, LoginInput } from "../types/user.type";

export class RegisterDTO {
  static schema = registerSchema;

  static validate(data: unknown): RegisterInput {
    return this.schema.parse(data);
  }
}

export class LoginDTO {
  static schema = loginSchema;

  static validate(data: unknown): LoginInput {
    return this.schema.parse(data);
  }
}