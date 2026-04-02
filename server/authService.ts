import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from './storage';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'trivia-masters-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: number;
  username: string;
}

export class AuthService {
  private saltRounds = 10;

  signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  }

  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }

  async registerUser(username: string, password: string): Promise<{ success: boolean; token?: string; userId?: number; username?: string; error?: string }> {
    try {
      if (!username || username.trim().length < 2) {
        return { success: false, error: 'Username must be at least 2 characters' };
      }
      if (!password || password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const existingUser = await db.select().from(users).where(eq(users.username, username.trim()));
      if (existingUser.length > 0) {
        return { success: false, error: 'Username already taken' };
      }

      const passwordHash = await this.hashPassword(password);
      const [newUser] = await db.insert(users)
        .values({ username: username.trim(), passwordHash })
        .returning();

      const token = this.signToken({ userId: newUser.id, username: newUser.username });
      return { success: true, token, userId: newUser.id, username: newUser.username };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }

  async loginUser(username: string, password: string): Promise<{ success: boolean; token?: string; userId?: number; username?: string; error?: string }> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username.trim()));
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }

      const isValid = await this.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Invalid username or password' };
      }

      const token = this.signToken({ userId: user.id, username: user.username });
      return { success: true, token, userId: user.id, username: user.username };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async getUserById(userId: number): Promise<{ id: number; username: string } | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      return user ? { id: user.id, username: user.username } : null;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
