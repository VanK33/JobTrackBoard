/**
 * Authentication & Authorization Service
 * Handles user authentication, sessions, and permissions
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/logger.js';
import {
  AuthService,
  LoginCredentials,
  CreateUserData,
  User,
  AuthResult,
  SessionInfo,
  UserPreferences,
  PermissionManager
} from '../../../../../shared/types/src/index.js';
import { DataService } from './data-service.js';

export class AuthenticationService implements AuthService {
  private logger: Logger;
  private jwtSecret: string;
  private sessionTTL: number = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private dataService: DataService,
    jwtSecret: string = 'your-secret-key-here'
  ) {
    this.logger = new Logger('AuthService');
    this.jwtSecret = jwtSecret;
    this.initializeCollections();
  }

  private async initializeCollections(): Promise<void> {
    try {
      await this.dataService.createCollection('users', {
        id: { type: 'string', unique: true },
        email: { type: 'string', unique: true },
        password: { type: 'string' },
        name: { type: 'string' },
        status: { type: 'string' },
        preferences: { type: 'object' },
        permissions: { type: 'array' }
      });

      await this.dataService.createCollection('sessions', {
        sessionId: { type: 'string', unique: true },
        userId: { type: 'string' },
        token: { type: 'string' },
        expiresAt: { type: 'string' }
      });
    } catch (error) {
      this.logger.debug('Collections already exist or creation failed', { error });
    }
  }

  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;
      
      // Find user by email
      const user = await this.dataService.findOne('users', { email });
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check password
      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check user status
      if (user.status !== 'active') {
        return { success: false, error: 'Account is not active' };
      }

      // Create session
      const session = await this.createSession(user.id);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      this.logger.info('User authenticated successfully', { userId: user.id, email });
      
      return {
        success: true,
        user: userWithoutPassword as User,
        session
      };

    } catch (error) {
      this.logger.error('Authentication failed', { error: error.message });
      return { success: false, error: 'Authentication failed' };
    }
  }

  async authorize(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return false;
      }

      // Check if user has the specific permission
      if (user.permissions.includes(permission)) {
        return true;
      }

      // Check for wildcard permissions
      const permissionParts = permission.split(':');
      for (let i = permissionParts.length; i > 0; i--) {
        const wildcardPermission = permissionParts.slice(0, i).join(':') + ':*';
        if (user.permissions.includes(wildcardPermission)) {
          return true;
        }
      }

      // Check for admin permission
      if (user.permissions.includes('admin:*')) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Authorization check failed', { userId, permission, error: error.message });
      return false;
    }
  }

  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const { email, password, name, preferences } = userData;

      // Check if user already exists
      const existingUser = await this.dataService.findOne('users', { email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userId = this.generateUserId();
      const now = new Date().toISOString();

      const defaultPreferences: UserPreferences = {
        theme: 'light',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          inApp: true
        },
        modules: {
          enabledModules: [],
          moduleSettings: {}
        },
        ...preferences
      };

      const user = {
        id: userId,
        email,
        password: hashedPassword,
        name,
        createdAt: now,
        updatedAt: now,
        preferences: defaultPreferences,
        permissions: ['user:basic'], // Default permissions
        status: 'active'
      };

      await this.dataService.create('users', user);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      this.logger.info('User created successfully', { userId, email });
      
      return userWithoutPassword as User;

    } catch (error) {
      this.logger.error('Failed to create user', { error: error.message });
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const user = await this.dataService.findOne('users', { id: userId });
      if (!user) {
        return null;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;

    } catch (error) {
      this.logger.error('Failed to get user', { userId, error: error.message });
      return null;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const allowedUpdates = ['name', 'preferences', 'status'];
      const filteredUpdates = Object.keys(updates)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {} as any);

      filteredUpdates.updatedAt = new Date().toISOString();

      const success = await this.dataService.update('users', { id: userId }, {
        $set: filteredUpdates
      });

      if (!success) {
        throw new Error('User not found or update failed');
      }

      const updatedUser = await this.getUser(userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      this.logger.info('User updated successfully', { userId });
      return updatedUser;

    } catch (error) {
      this.logger.error('Failed to update user', { userId, error: error.message });
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Delete user sessions first
      await this.dataService.delete('sessions', { userId });
      
      // Delete user
      const success = await this.dataService.delete('users', { id: userId });
      
      if (success) {
        this.logger.info('User deleted successfully', { userId });
      }
      
      return success;

    } catch (error) {
      this.logger.error('Failed to delete user', { userId, error: error.message });
      return false;
    }
  }

  async createSession(userId: string): Promise<SessionInfo> {
    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + this.sessionTTL).toISOString();
      
      // Create JWT token
      const token = jwt.sign({ userId, sessionId }, this.jwtSecret, {
        expiresIn: '24h'
      });

      const session = {
        sessionId,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt,
        token
      };

      await this.dataService.create('sessions', session);

      this.logger.debug('Session created', { userId, sessionId });

      return {
        sessionId,
        userId,
        createdAt: session.createdAt,
        expiresAt,
        token
      };

    } catch (error) {
      this.logger.error('Failed to create session', { userId, error: error.message });
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<SessionInfo | null> {
    try {
      // Verify JWT token
      const decoded = jwt.verify(sessionToken, this.jwtSecret) as any;
      const { userId, sessionId } = decoded;

      // Check if session exists and is not expired
      const session = await this.dataService.findOne('sessions', { sessionId });
      if (!session) {
        return null;
      }

      if (new Date(session.expiresAt) < new Date()) {
        // Session expired, clean it up
        await this.destroySession(sessionToken);
        return null;
      }

      return {
        sessionId: session.sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        token: sessionToken
      };

    } catch (error) {
      this.logger.debug('Session validation failed', { error: error.message });
      return null;
    }
  }

  async destroySession(sessionToken: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(sessionToken, this.jwtSecret) as any;
      const { sessionId } = decoded;

      const success = await this.dataService.delete('sessions', { sessionId });
      
      if (success) {
        this.logger.debug('Session destroyed', { sessionId });
      }
      
      return success;

    } catch (error) {
      this.logger.debug('Failed to destroy session', { error: error.message });
      return false;
    }
  }

  async grantPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.dataService.findOne('users', { id: userId });
      if (!user) {
        return false;
      }

      if (!user.permissions.includes(permission)) {
        user.permissions.push(permission);
        await this.dataService.update('users', { id: userId }, {
          $set: { permissions: user.permissions }
        });
      }

      this.logger.info('Permission granted', { userId, permission });
      return true;

    } catch (error) {
      this.logger.error('Failed to grant permission', { userId, permission, error: error.message });
      return false;
    }
  }

  async revokePermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.dataService.findOne('users', { id: userId });
      if (!user) {
        return false;
      }

      const index = user.permissions.indexOf(permission);
      if (index > -1) {
        user.permissions.splice(index, 1);
        await this.dataService.update('users', { id: userId }, {
          $set: { permissions: user.permissions }
        });
      }

      this.logger.info('Permission revoked', { userId, permission });
      return true;

    } catch (error) {
      this.logger.error('Failed to revoke permission', { userId, permission, error: error.message });
      return false;
    }
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.getUser(userId);
      return user ? user.permissions : [];
    } catch (error) {
      this.logger.error('Failed to get user permissions', { userId, error: error.message });
      return [];
    }
  }

  // Create module-specific permission manager
  createModulePermissionManager(moduleId: string): PermissionManager {
    return new ModulePermissionManager(this, moduleId);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Module-specific permission manager
class ModulePermissionManager implements PermissionManager {
  private logger: Logger;

  constructor(
    private authService: AuthenticationService,
    private moduleId: string
  ) {
    this.logger = new Logger(`PermissionManager:${moduleId}`);
  }

  hasPermission(permission: string): boolean {
    // For module context, we assume system permissions
    // In a real implementation, this would check the current user context
    return true;
  }

  async requestPermission(permission: string): Promise<boolean> {
    // For module context, this would request permission from the platform
    this.logger.debug('Permission requested', { moduleId: this.moduleId, permission });
    return true;
  }

  async revokePermission(permission: string): Promise<void> {
    // For module context, this would revoke permission
    this.logger.debug('Permission revoked', { moduleId: this.moduleId, permission });
  }
}