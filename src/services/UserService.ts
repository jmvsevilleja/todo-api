import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection';
import { 
  IUserService, 
  CreateUserData, 
  UserResponseDto, 
  User,
  ValidationError,
  mapUserToDto
} from '../types';

export class UserService implements IUserService {
  async createUser(userData: CreateUserData): Promise<UserResponseDto> {
    const existingUser = await this.findUserByEmail(userData.email);
    
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const userId = uuidv4();

    const { rows } = await db.query<User>(
      `INSERT INTO users (id, email, password, name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [userId, userData.email, hashedPassword, userData.name || null]
    );

    return mapUserToDto(rows[0]);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const { rows } = await db.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return rows[0] || null;
  }

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const { rows } = await db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    return rows[0] ? mapUserToDto(rows[0]) : null;
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async updateUser(id: string, updateData: Partial<CreateUserData>): Promise<UserResponseDto> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.name !== undefined) {
      setParts.push(`name = $${paramIndex++}`);
      values.push(updateData.name);
    }

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 12);
      setParts.push(`password = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    if (setParts.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    values.push(id);

    const { rows } = await db.query<User>(
      `UPDATE users SET ${setParts.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values
    );

    if (rows.length === 0) {
      throw new ValidationError('User not found');
    }

    return mapUserToDto(rows[0]);
  }

  async deleteUser(id: string): Promise<void> {
    const { rowCount } = await db.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw new ValidationError('User not found');
    }
  }

  async getUserStats(id: string): Promise<{
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
  }> {
    const { rows } = await db.query<{
      total_todos: string;
      completed_todos: string;
      pending_todos: string;
    }>(
      `SELECT 
        COUNT(*) as total_todos,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_todos,
        COUNT(CASE WHEN completed = false THEN 1 END) as pending_todos
       FROM todos 
       WHERE user_id = $1`,
      [id]
    );

    const stats = rows[0];
    return {
      totalTodos: parseInt(stats.total_todos),
      completedTodos: parseInt(stats.completed_todos),
      pendingTodos: parseInt(stats.pending_todos)
    };
  }
}