/**
 * Storage Service - Handles file storage with multiple provider support
 * Supports AWS S3, Google Cloud, Azure Blob, and local storage
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Logger } from '../utils/logger.js';
import {
  PlatformStorageService,
  FileUpload,
  FileDownload,
  FileMetadata,
  StorageOptions,
  StorageResult,
  StorageProvider,
  MigrationResult,
  StorageService as ModuleStorageServiceInterface
} from '../../../../../shared/types/src/index.js';
import { DataService } from './data-service.js';

export class StorageService implements PlatformStorageService {
  private providers = new Map<string, StorageProviderImplementation>();
  private defaultProviderId: string = 'local';
  private logger: Logger;
  private localStoragePath: string;

  constructor(
    private dataService: DataService,
    localStoragePath: string = './storage'
  ) {
    this.logger = new Logger('StorageService');
    this.localStoragePath = localStoragePath;
    this.initializeCollections();
    this.setupDefaultProviders();
  }

  private async initializeCollections(): Promise<void> {
    try {
      await this.dataService.createCollection('files', {
        id: { type: 'string', unique: true },
        filename: { type: 'string' },
        size: { type: 'number' },
        contentType: { type: 'string' },
        uploadedBy: { type: 'string' },
        provider: { type: 'string' },
        metadata: { type: 'object' }
      });

      await this.dataService.createCollection('storage_providers', {
        id: { type: 'string', unique: true },
        name: { type: 'string' },
        type: { type: 'string' },
        config: { type: 'object' },
        enabled: { type: 'boolean' }
      });
    } catch (error) {
      this.logger.debug('Collections already exist or creation failed', { error });
    }
  }

  private async setupDefaultProviders(): Promise<void> {
    // Setup local storage provider
    const localProvider = new LocalStorageProvider(this.localStoragePath);
    this.providers.set('local', localProvider);

    // Ensure local storage directory exists
    await fs.mkdir(this.localStoragePath, { recursive: true });

    this.logger.info('Default storage providers initialized');
  }

  async upload(file: FileUpload, options?: StorageOptions): Promise<StorageResult> {
    try {
      const providerId = options?.provider || this.defaultProviderId;
      const provider = this.providers.get(providerId);
      
      if (!provider) {
        throw new Error(`Storage provider '${providerId}' not found`);
      }

      // Generate file ID
      const fileId = this.generateFileId();
      
      // Upload to provider
      const providerResult = await provider.upload(fileId, file.content, {
        contentType: file.contentType,
        metadata: file.metadata
      });

      // Store file metadata
      const fileMetadata: FileMetadata = {
        id: fileId,
        filename: file.filename,
        size: file.content.length,
        contentType: file.contentType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system', // Should be actual user ID
        provider: providerId,
        metadata: file.metadata || {}
      };

      await this.dataService.create('files', fileMetadata);

      this.logger.info('File uploaded successfully', { 
        fileId, 
        filename: file.filename, 
        provider: providerId 
      });

      return {
        fileId,
        url: providerResult.url,
        provider: providerId
      };

    } catch (error) {
      this.logger.error('Failed to upload file', { 
        filename: file.filename, 
        error: error.message 
      });
      throw error;
    }
  }

  async download(fileId: string): Promise<FileDownload> {
    try {
      // Get file metadata
      const fileMetadata = await this.getMetadata(fileId);
      if (!fileMetadata) {
        throw new Error(`File '${fileId}' not found`);
      }

      // Get provider
      const provider = this.providers.get(fileMetadata.provider);
      if (!provider) {
        throw new Error(`Storage provider '${fileMetadata.provider}' not found`);
      }

      // Download from provider
      const content = await provider.download(fileId);

      this.logger.debug('File downloaded successfully', { 
        fileId, 
        filename: fileMetadata.filename 
      });

      return {
        filename: fileMetadata.filename,
        content,
        contentType: fileMetadata.contentType,
        metadata: fileMetadata.metadata
      };

    } catch (error) {
      this.logger.error('Failed to download file', { fileId, error: error.message });
      throw error;
    }
  }

  async delete(fileId: string): Promise<boolean> {
    try {
      // Get file metadata
      const fileMetadata = await this.getMetadata(fileId);
      if (!fileMetadata) {
        this.logger.warn('File not found for deletion', { fileId });
        return false;
      }

      // Get provider
      const provider = this.providers.get(fileMetadata.provider);
      if (!provider) {
        throw new Error(`Storage provider '${fileMetadata.provider}' not found`);
      }

      // Delete from provider
      await provider.delete(fileId);

      // Delete metadata
      await this.dataService.delete('files', { id: fileId });

      this.logger.info('File deleted successfully', { 
        fileId, 
        filename: fileMetadata.filename 
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to delete file', { fileId, error: error.message });
      throw error;
    }
  }

  async getMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const metadata = await this.dataService.findOne('files', { id: fileId });
      return metadata as FileMetadata || null;
    } catch (error) {
      this.logger.error('Failed to get file metadata', { fileId, error: error.message });
      return null;
    }
  }

  async addProvider(provider: StorageProvider): Promise<boolean> {
    try {
      // Store provider config in database
      await this.dataService.create('storage_providers', provider);

      // Initialize provider implementation
      let providerImpl: StorageProviderImplementation;
      
      switch (provider.type) {
        case 'local':
          providerImpl = new LocalStorageProvider(provider.config.path || './storage');
          break;
        case 'aws-s3':
          providerImpl = new S3StorageProvider(provider.config);
          break;
        case 'google-cloud':
          providerImpl = new GCStorageProvider(provider.config);
          break;
        case 'azure-blob':
          providerImpl = new AzureStorageProvider(provider.config);
          break;
        default:
          throw new Error(`Unsupported storage provider type: ${provider.type}`);
      }

      this.providers.set(provider.id, providerImpl);

      this.logger.info('Storage provider added', { 
        id: provider.id, 
        type: provider.type 
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to add storage provider', { 
        provider: provider.id, 
        error: error.message 
      });
      return false;
    }
  }

  async removeProvider(providerId: string): Promise<boolean> {
    try {
      // Remove from database
      await this.dataService.delete('storage_providers', { id: providerId });

      // Remove from memory
      this.providers.delete(providerId);

      this.logger.info('Storage provider removed', { providerId });
      return true;

    } catch (error) {
      this.logger.error('Failed to remove storage provider', { 
        providerId, 
        error: error.message 
      });
      return false;
    }
  }

  async setDefaultProvider(providerId: string): Promise<boolean> {
    try {
      if (!this.providers.has(providerId)) {
        throw new Error(`Provider '${providerId}' not found`);
      }

      this.defaultProviderId = providerId;
      
      this.logger.info('Default storage provider changed', { providerId });
      return true;

    } catch (error) {
      this.logger.error('Failed to set default provider', { 
        providerId, 
        error: error.message 
      });
      return false;
    }
  }

  async migrateFiles(fromProvider: string, toProvider: string): Promise<MigrationResult> {
    try {
      const fromProviderImpl = this.providers.get(fromProvider);
      const toProviderImpl = this.providers.get(toProvider);

      if (!fromProviderImpl || !toProviderImpl) {
        throw new Error('One or both providers not found');
      }

      // Get all files from the source provider
      const files = await this.dataService.find('files', { provider: fromProvider });
      
      let migratedFiles = 0;
      let failedFiles = 0;
      const errors: string[] = [];

      for (const file of files) {
        try {
          // Download from source
          const content = await fromProviderImpl.download(file.id);
          
          // Upload to destination
          await toProviderImpl.upload(file.id, content, {
            contentType: file.contentType,
            metadata: file.metadata
          });

          // Update database
          await this.dataService.update('files', { id: file.id }, {
            $set: { provider: toProvider }
          });

          // Delete from source
          await fromProviderImpl.delete(file.id);

          migratedFiles++;

        } catch (error) {
          failedFiles++;
          errors.push(`Failed to migrate ${file.filename}: ${error.message}`);
          this.logger.error('File migration failed', { 
            fileId: file.id, 
            error: error.message 
          });
        }
      }

      this.logger.info('File migration completed', { 
        fromProvider, 
        toProvider, 
        migratedFiles, 
        failedFiles 
      });

      return {
        success: failedFiles === 0,
        migratedFiles,
        failedFiles,
        errors
      };

    } catch (error) {
      this.logger.error('File migration failed', { 
        fromProvider, 
        toProvider, 
        error: error.message 
      });
      
      return {
        success: false,
        migratedFiles: 0,
        failedFiles: 0,
        errors: [error.message]
      };
    }
  }

  // Create module-specific storage service
  createModuleStorageService(moduleId: string): ModuleStorageServiceInterface {
    return new ModuleStorageService(this, moduleId);
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Storage provider interface
interface StorageProviderImplementation {
  upload(fileId: string, content: Buffer, options: any): Promise<{ url: string }>;
  download(fileId: string): Promise<Buffer>;
  delete(fileId: string): Promise<void>;
}

// Local storage provider implementation
class LocalStorageProvider implements StorageProviderImplementation {
  private logger: Logger;

  constructor(private basePath: string) {
    this.logger = new Logger('LocalStorage');
  }

  async upload(fileId: string, content: Buffer, options: any): Promise<{ url: string }> {
    const filePath = path.join(this.basePath, fileId);
    await fs.writeFile(filePath, content);
    
    return { url: `/storage/${fileId}` };
  }

  async download(fileId: string): Promise<Buffer> {
    const filePath = path.join(this.basePath, fileId);
    return await fs.readFile(filePath);
  }

  async delete(fileId: string): Promise<void> {
    const filePath = path.join(this.basePath, fileId);
    await fs.unlink(filePath);
  }
}

// Placeholder implementations for other providers
class S3StorageProvider implements StorageProviderImplementation {
  constructor(private config: any) {}

  async upload(fileId: string, content: Buffer, options: any): Promise<{ url: string }> {
    // TODO: Implement AWS S3 upload
    throw new Error('S3 storage not implemented');
  }

  async download(fileId: string): Promise<Buffer> {
    // TODO: Implement AWS S3 download
    throw new Error('S3 storage not implemented');
  }

  async delete(fileId: string): Promise<void> {
    // TODO: Implement AWS S3 delete
    throw new Error('S3 storage not implemented');
  }
}

class GCStorageProvider implements StorageProviderImplementation {
  constructor(private config: any) {}

  async upload(fileId: string, content: Buffer, options: any): Promise<{ url: string }> {
    // TODO: Implement Google Cloud Storage upload
    throw new Error('Google Cloud storage not implemented');
  }

  async download(fileId: string): Promise<Buffer> {
    // TODO: Implement Google Cloud Storage download
    throw new Error('Google Cloud storage not implemented');
  }

  async delete(fileId: string): Promise<void> {
    // TODO: Implement Google Cloud Storage delete
    throw new Error('Google Cloud storage not implemented');
  }
}

class AzureStorageProvider implements StorageProviderImplementation {
  constructor(private config: any) {}

  async upload(fileId: string, content: Buffer, options: any): Promise<{ url: string }> {
    // TODO: Implement Azure Blob storage upload
    throw new Error('Azure storage not implemented');
  }

  async download(fileId: string): Promise<Buffer> {
    // TODO: Implement Azure Blob storage download
    throw new Error('Azure storage not implemented');
  }

  async delete(fileId: string): Promise<void> {
    // TODO: Implement Azure Blob storage delete
    throw new Error('Azure storage not implemented');
  }
}

// Module-specific storage service wrapper
class ModuleStorageService implements ModuleStorageServiceInterface {
  private logger: Logger;

  constructor(
    private storageService: StorageService,
    private moduleId: string
  ) {
    this.logger = new Logger(`Storage:${moduleId}`);
  }

  async upload(file: Buffer, key: string, options?: StorageOptions): Promise<string> {
    const fileUpload: FileUpload = {
      filename: key,
      content: file,
      contentType: options?.contentType || 'application/octet-stream',
      metadata: { ...options?.metadata, moduleId: this.moduleId }
    };

    const result = await this.storageService.upload(fileUpload, options);
    return result.fileId;
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.storageService.download(key);
    return result.content;
  }

  async delete(key: string): Promise<void> {
    await this.storageService.delete(key);
  }

  async getUrl(key: string): Promise<string> {
    const metadata = await this.storageService.getMetadata(key);
    if (!metadata) {
      throw new Error('File not found');
    }
    
    // Return a URL to access the file
    return `/api/files/${key}`;
  }
}