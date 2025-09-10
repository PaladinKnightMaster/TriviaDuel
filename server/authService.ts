import bcrypt from 'bcrypt';
import { db } from './storage';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

export class AuthService {
  private saltRounds = 12;

  async hashPassword(plainPassword: string): Promise<string> {
    return await bcrypt.hash(plainPassword, this.saltRounds);
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hash);
  }

  async registerUser(username: string, password: string): Promise<{ success: boolean; userId?: number; error?: string }> {
    try {
      // Check if username already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username));
      if (existingUser.length > 0) {
        return { success: false, error: 'Username already exists' };
      }

      // Hash password and create user
      const passwordHash = await this.hashPassword(password);
      const [newUser] = await db.insert(users)
        .values({
          username,
          passwordHash
        })
        .returning();

      return { success: true, userId: newUser.id };
    } catch (error) {
      console.error('Error registering user:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async loginUser(username: string, password: string): Promise<{ success: boolean; userId?: number; error?: string }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid username or password' };
      }

      return { success: true, userId: user.id };
    } catch (error) {
      console.error('Error logging in user:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async getUserById(userId: number): Promise<{ id: number; username: string } | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) return null;
      
      return {
        id: user.id,
        username: user.username
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }
}