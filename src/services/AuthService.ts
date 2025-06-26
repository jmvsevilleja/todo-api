import {
  IAuthService,
  IUserService,
  CreateUserData,
  LoginData,
  AuthResponseDto,
  AuthUser,
  AuthenticationError,
  ValidationError,
} from "../types";
import { generateToken, verifyToken } from "../utils/jwt";

export class AuthService implements IAuthService {
  constructor(private readonly userService: IUserService) {}

  async register(userData: CreateUserData): Promise<AuthResponseDto> {
    const user = await this.userService.createUser(userData);

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      token,
    };
  }

  async login(loginData: LoginData): Promise<AuthResponseDto> {
    const user = await this.userService.findUserByEmail(loginData.email);

    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    const isPasswordValid = await this.userService.validatePassword(
      loginData.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid credentials");
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = verifyToken(token);

      const user = await this.userService.findUserById(decoded.userId);

      if (!user) {
        throw new AuthenticationError("User not found");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      throw new AuthenticationError("Invalid or expired token");
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    // Implementation for refresh token logic
    throw new Error("Refresh token not implemented yet");
  }

  async logout(token: string): Promise<void> {
    // Implementation for token blacklisting
    throw new Error("Logout not implemented yet");
  }
}
