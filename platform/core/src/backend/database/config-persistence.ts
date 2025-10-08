/**
 * Configuration Persistence Service
 * Manages saving and loading database configuration to/from file system
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { DatabaseConfig } from './sqlite-service.js';
import { Logger } from '../utils/logger.js';

export class ConfigPersistenceService {
  private static readonly CONFIG_FILE = join(process.cwd(), 'database-config.json');
  private static logger = new Logger('ConfigPersistenceService');

  /**
   * Save database configuration to file
   */
  static saveConfig(config: DatabaseConfig): void {
    try {
      const configData = {
        ...config,
        savedAt: new Date().toISOString()
      };

      writeFileSync(this.CONFIG_FILE, JSON.stringify(configData, null, 2));
      this.logger.info('Database configuration saved to file', {
        type: config.type,
        host: config.host || 'local'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to save configuration', { error: message });
      throw error;
    }
  }

  /**
   * Load database configuration from file
   */
  static loadConfig(): DatabaseConfig | null {
    try {
      if (!existsSync(this.CONFIG_FILE)) {
        this.logger.info('No saved configuration found, using default SQLite');
        return null;
      }

      const configData = readFileSync(this.CONFIG_FILE, 'utf8');
      const config = JSON.parse(configData);

      // Remove savedAt field for clean config
      delete config.savedAt;

      this.logger.info('Loaded saved database configuration', {
        type: config.type,
        host: config.host || 'local'
      });

      return config;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to load configuration', { error: message });
      return null;
    }
  }

  /**
   * Get default SQLite configuration
   */
  static getDefaultConfig(): DatabaseConfig {
    return {
      type: 'sqlite',
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
      connectionString: '',
      storage: {
        provider: 'supabase',
        tempDir: './temp-uploads',
        localStorageDir: './uploads'
      }
    };
  }

  /**
   * Delete saved configuration file
   */
  static clearConfig(): void {
    try {
      if (existsSync(this.CONFIG_FILE)) {
        const fs = require('fs');
        fs.unlinkSync(this.CONFIG_FILE);
        this.logger.info('Cleared saved database configuration');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to clear configuration', { error: message });
    }
  }

  /**
   * Check if a saved configuration exists
   */
  static hasConfig(): boolean {
    const exists = existsSync(this.CONFIG_FILE);
    this.logger.info('Checking for saved configuration', {
      path: this.CONFIG_FILE,
      exists,
      cwd: process.cwd()
    });
    return exists;
  }

  /**
   * Get the full path to the config file
   */
  static getConfigPath(): string {
    return this.CONFIG_FILE;
  }
}