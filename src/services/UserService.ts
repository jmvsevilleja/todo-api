import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  IUserService,
  CreateUserData,
  UserResponseDto,
  User,
  ConflictError,
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
      throw new ConflictError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name || null
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

  async updateUser(id: string, updateData: Partial<CreateUserData>): Promise<UserResponseDto> {
    const existingUser = await this.findUserById(id);
    if (!existingUser) {
      throw new NotFoundError('User');
    }

    const data: any = {};

    if (updateData.name !== undefined) {
      data.name = updateData.name;
    }

    if (updateData.password) {
      data.password = await bcrypt.hash(updateData.password, 12);
    }

    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.findUserByEmail(updateData.email);
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
      data.email = updateData.email;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.prisma.user.delete({
      where: { id }
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
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
}