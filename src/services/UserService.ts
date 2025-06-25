import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  IUserService, 
  CreateUserData, 
  UserResponseDto, 
  User,
  ValidationError,
  NotFoundError,
  Result,
  createSuccess,
  createError
} from '../types';

export class UserService implements IUserService {
  constructor(private readonly prisma: PrismaClient) {}

  async createUser(userData: CreateUserData): Promise<UserResponseDto> {
    const existingUser = await this.findUserByEmail(userData.email);
    
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return user;
  }

  // Using Result type for better error handling
  async findUserByEmailSafe(email: string): Promise<Result<User | null>> {
    try {
      const user = await this.findUserByEmail(email);
      return createSuccess(user);
    } catch (error) {
      return createError(error as Error);
    }
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}