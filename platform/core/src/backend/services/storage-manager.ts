/**
 * Unified Storage Manager
 * Supports multiple storage providers with automatic temporary file cleanup
 */

import fs from 'fs/promises';
import path from 'path';
import { Logger } from '../utils/logger.js';
import { supabaseStorage } from './supabase-client.js';

// Storage provider interface
export interface StorageProvider {
  upload(filePath: string, jobId: string, mimeType: string): Promise<{
    url: string;
    path: string;
    size: number;
  }>;
  delete(storagePath: string): Promise<boolean>;
  getPublicUrl(storagePath: string): string;
}

// Supabase storage provider implementation
class SupabaseStorageProvider implements StorageProvider {
  async upload(filePath: string, jobId: string, mimeType: string): Promise<{
    url: string;
    path: string;
    size: number;
  }> {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = path.basename(filePath);

    return await supabaseStorage.uploadFile(
      fileBuffer,
      fileName,
      jobId,
      mimeType
    );
  }

  async delete(storagePath: string): Promise<boolean> {
    return await supabaseStorage.deleteFile(storagePath);
  }

  getPublicUrl(storagePath: string): string {
    return supabaseStorage.getPublicUrl(storagePath);
  }
}

// Local storage provider (fallback)
class LocalStorageProvider implements StorageProvider {
  private storageDir: string;

  constructor(storageDir: string = './uploads') {
    this.storageDir = storageDir;
  }

  async upload(filePath: string, jobId: string, mimeType: string): Promise<{
    url: string;
    path: string;
    size: number;
  }> {
    // Ensure storage directory exists
    await fs.mkdir(path.join(this.storageDir, 'jobs', jobId), { recursive: true });

    const fileName = path.basename(filePath);
    const storagePath = path.join('jobs', jobId, fileName);
    const fullStoragePath = path.join(this.storageDir, storagePath);

    // Copy file from temp to storage
    await fs.copyFile(filePath, fullStoragePath);

    const stats = await fs.stat(fullStoragePath);

    return {
      url: `/uploads/${storagePath}`,
      path: storagePath,
      size: stats.size
    };
  }

  async delete(storagePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.storageDir, storagePath);
      await fs.unlink(fullPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  getPublicUrl(storagePath: string): string {
    return `/uploads/${storagePath}`;
  }
}

// Placeholder providers
class S3StorageProvider implements StorageProvider {
  async upload(): Promise<any> {
    throw new Error('S3 storage not implemented yet');
  }

  async delete(): Promise<boolean> {
    throw new Error('S3 storage not implemented yet');
  }

  getPublicUrl(): string {
    throw new Error('S3 storage not implemented yet');
  }
}

class AzureStorageProvider implements StorageProvider {
  async upload(): Promise<any> {
    throw new Error('Azure storage not implemented yet');
  }

  async delete(): Promise<boolean> {
    throw new Error('Azure storage not implemented yet');
  }

  getPublicUrl(): string {
    throw new Error('Azure storage not implemented yet');
  }
}

export type StorageProviderType = 'supabase' | 'local' | 's3' | 'azure';

export interface StorageConfig {
  provider: StorageProviderType;
  tempDir?: string;
  localStorageDir?: string;
  supabase?: {
    url: string;
    serviceKey: string;
  };
  s3?: {
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
  };
  azure?: {
    connectionString: string;
    containerName: string;
  };
}

export class StorageManager {
  private currentProvider: StorageProvider;
  private config: StorageConfig;
  private logger: Logger;
  private tempDir: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
    this.logger = new Logger('StorageManager');
    this.tempDir = config.tempDir || './temp-uploads';
    this.currentProvider = this.createProvider(config.provider);

    this.initializeTempDirectory();
    this.startCleanupTask();
  }

  private createProvider(providerType: StorageProviderType): StorageProvider {
    switch (providerType) {
      case 'supabase':
        return new SupabaseStorageProvider();
      case 'local':
        return new LocalStorageProvider(this.config.localStorageDir);
      case 's3':
        return new S3StorageProvider();
      case 'azure':
        return new AzureStorageProvider();
      default:
        this.logger.warn(`Unknown storage provider: ${providerType}, falling back to local`);
        return new LocalStorageProvider(this.config.localStorageDir);
    }
  }

  private async initializeTempDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });

      // Clean up any existing temp files on startup
      await this.cleanupTempFiles();

      this.logger.info(`Storage manager initialized with ${this.config.provider} provider`);
    } catch (error: any) {
      this.logger.error('Failed to initialize temp directory', error);
      throw error;
    }
  }

  async uploadFile(tempFilePath: string, jobId: string, mimeType: string): Promise<{
    url: string;
    path: string;
    size: number;
  }> {
    try {
      // Upload to storage provider
      const result = await this.currentProvider.upload(tempFilePath, jobId, mimeType);

      // Clean up temp file immediately after successful upload
      await this.deleteTempFile(tempFilePath);

      this.logger.info('File uploaded successfully', {
        jobId,
        provider: this.config.provider,
        storagePath: result.path
      });

      return result;
    } catch (error: any) {
      this.logger.error('Failed to upload file', { error: error.message, tempFilePath });

      // Try to clean up temp file even on failure
      try {
        await this.deleteTempFile(tempFilePath);
      } catch (cleanupError) {
        this.logger.warn('Failed to cleanup temp file after upload failure', { tempFilePath });
      }

      throw error;
    }
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const result = await this.currentProvider.delete(storagePath);
      this.logger.info('File deleted from storage', { storagePath, success: result });
      return result;
    } catch (error: any) {
      this.logger.error('Failed to delete file from storage', { error: error.message, storagePath });
      return false;
    }
  }

  getPublicUrl(storagePath: string): string {
    return this.currentProvider.getPublicUrl(storagePath);
  }

  private async deleteTempFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.debug('Temp file deleted', { filePath });
    } catch (error: any) {
      this.logger.warn('Failed to delete temp file', { filePath, error: error.message });
    }
  }

  private async cleanupTempFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);

        try {
          const stats = await fs.stat(filePath);

          // Delete files older than 1 hour
          if (now - stats.mtime.getTime() > oneHour) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // File might have been deleted already, ignore
        }
      }

      if (cleanedCount > 0) {
        this.logger.info(`Cleaned up ${cleanedCount} old temp files`);
      }
    } catch (error: any) {
      this.logger.error('Failed to cleanup temp files', { error: error.message });
    }
  }

  private startCleanupTask(): void {
    // Run cleanup every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupTempFiles();
    }, 30 * 60 * 1000);

    this.logger.info('Temp file cleanup task started (runs every 30 minutes)');
  }

  async changeProvider(newConfig: StorageConfig): Promise<void> {
    this.config = newConfig;
    this.currentProvider = this.createProvider(newConfig.provider);
    this.logger.info(`Storage provider changed to: ${newConfig.provider}`);
  }

  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Final cleanup before shutdown
    await this.cleanupTempFiles();

    this.logger.info('Storage manager shut down');
  }
}