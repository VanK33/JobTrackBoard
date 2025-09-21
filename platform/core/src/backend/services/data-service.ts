/**
 * Data Service - Handles all data operations for the platform and modules
 * This provides the abstraction layer over different databases
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { Logger } from '../utils/logger.js';
import {
  PlatformDataService,
  DataQuery,
  ModuleSchema,
  DataService as ModuleDataServiceInterface,
  ModuleEntity,
  DataFilter
} from '../../../../../shared/types/src/index.js';

export class DataService implements PlatformDataService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private logger: Logger;
  private moduleDataServices = new Map<string, ModuleDataService>();

  constructor(private connectionUrl: string, private databaseName: string) {
    this.logger = new Logger('DataService');
  }

  async connect(): Promise<boolean> {
    try {
      this.client = new MongoClient(this.connectionUrl);
      await this.client.connect();
      this.db = this.client.db(this.databaseName);
      
      this.logger.info('Connected to database', { database: this.databaseName });
      return true;
    } catch (error) {
      this.logger.error('Failed to connect to database', { error: error.message });
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.logger.info('Disconnected from database');
      }
      return true;
    } catch (error) {
      this.logger.error('Failed to disconnect from database', { error: error.message });
      return false;
    }
  }

  // Platform internal methods
  async createCollection(name: string, schema: any): Promise<boolean> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const collections = await this.db.listCollections().toArray();
      const exists = collections.some(col => col.name === name);
      
      if (!exists) {
        await this.db.createCollection(name);
        this.logger.debug('Created collection', { name });
      }
      
      return true;
    } catch (error) {
      this.logger.error('Failed to create collection', { name, error: error.message });
      throw error;
    }
  }

  async create(collectionName: string, data: any): Promise<any> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const collection = this.db.collection(collectionName);
      const result = await collection.insertOne({
        ...data,
        _createdAt: new Date(),
        _updatedAt: new Date()
      });
      
      return { _id: result.insertedId, ...data };
    } catch (error) {
      this.logger.error('Failed to create document', { collectionName, error: error.message });
      throw error;
    }
  }

  async findOne(collectionName: string, filter: any): Promise<any> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const collection = this.db.collection(collectionName);
      return await collection.findOne(filter);
    } catch (error) {
      this.logger.error('Failed to find document', { collectionName, error: error.message });
      throw error;
    }
  }

  async find(collectionName: string, filter: any = {}): Promise<any[]> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const collection = this.db.collection(collectionName);
      return await collection.find(filter).toArray();
    } catch (error) {
      this.logger.error('Failed to find documents', { collectionName, error: error.message });
      throw error;
    }
  }

  async update(collectionName: string, filter: any, update: any): Promise<boolean> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const collection = this.db.collection(collectionName);
      const result = await collection.updateOne(filter, {
        ...update,
        $set: { ...update.$set, _updatedAt: new Date() }
      });
      
      return result.modifiedCount > 0;
    } catch (error) {
      this.logger.error('Failed to update document', { collectionName, error: error.message });
      throw error;
    }
  }

  async delete(collectionName: string, filter: any): Promise<boolean> {
    try {
      if (!this.db) throw new Error('Database not connected');
      
      const collection = this.db.collection(collectionName);
      const result = await collection.deleteOne(filter);
      
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error('Failed to delete document', { collectionName, error: error.message });
      throw error;
    }
  }

  // Module-specific data operations
  async createModuleData<T>(moduleId: string, entityType: string, data: T, userId: string): Promise<string> {
    const entityId = this.generateId();
    const entity: ModuleEntity<T> = {
      _moduleId: moduleId,
      _entityType: entityType,
      _entityId: entityId,
      _version: 1,
      _metadata: {
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: [`read:${userId}`, `write:${userId}`]
      },
      data
    };

    await this.create('module_data', entity);
    return entityId;
  }

  async getModuleData<T>(moduleId: string, entityType: string, id: string, userId: string): Promise<T | null> {
    const entity = await this.findOne('module_data', {
      _moduleId: moduleId,
      _entityType: entityType,
      _entityId: id
    });

    if (!entity) return null;

    // Check permissions
    if (!this.hasReadPermission(entity, userId)) {
      throw new Error('Access denied');
    }

    return entity.data;
  }

  async updateModuleData<T>(moduleId: string, entityType: string, id: string, data: Partial<T>, userId: string): Promise<boolean> {
    const entity = await this.findOne('module_data', {
      _moduleId: moduleId,
      _entityType: entityType,
      _entityId: id
    });

    if (!entity) return false;

    // Check permissions
    if (!this.hasWritePermission(entity, userId)) {
      throw new Error('Access denied');
    }

    return await this.update('module_data', {
      _moduleId: moduleId,
      _entityType: entityType,
      _entityId: id
    }, {
      $set: {
        data: { ...entity.data, ...data },
        '_metadata.updatedAt': new Date().toISOString(),
        '_version': entity._version + 1
      }
    });
  }

  async deleteModuleData(moduleId: string, entityType: string, id: string, userId: string): Promise<boolean> {
    const entity = await this.findOne('module_data', {
      _moduleId: moduleId,
      _entityType: entityType,
      _entityId: id
    });

    if (!entity) return false;

    // Check permissions
    if (!this.hasWritePermission(entity, userId)) {
      throw new Error('Access denied');
    }

    return await this.delete('module_data', {
      _moduleId: moduleId,
      _entityType: entityType,
      _entityId: id
    });
  }

  async queryModuleData<T>(moduleId: string, entityType: string, query: DataQuery, userId: string): Promise<T[]> {
    const filter: any = {
      _moduleId: moduleId,
      _entityType: entityType
    };

    // Add query filters
    if (query.filter) {
      Object.keys(query.filter).forEach(key => {
        filter[`data.${key}`] = query.filter![key];
      });
    }

    // Add user permission filter
    filter['_metadata.permissions'] = { $in: [`read:${userId}`, 'read:public'] };

    const entities = await this.find('module_data', filter);
    
    // Apply sorting and pagination
    let results = entities;
    
    if (query.sort) {
      results.sort((a, b) => {
        for (const [field, direction] of Object.entries(query.sort!)) {
          const aVal = this.getNestedValue(a.data, field);
          const bVal = this.getNestedValue(b.data, field);
          const comparison = direction === 'asc' ? 
            (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) :
            (aVal < bVal ? 1 : aVal > bVal ? -1 : 0);
          if (comparison !== 0) return comparison;
        }
        return 0;
      });
    }

    if (query.offset) {
      results = results.slice(query.offset);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results.map(entity => entity.data);
  }

  async registerDataContract(moduleId: string, contract: any): Promise<boolean> {
    try {
      await this.create('data_contracts', {
        moduleId,
        contractName: contract.name,
        contract,
        registeredAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to register data contract', { moduleId, contract: contract.name, error });
      return false;
    }
  }

  async getDataContract(moduleId: string, contractName: string): Promise<any> {
    return await this.findOne('data_contracts', { moduleId, contractName });
  }

  async createModuleSchema(moduleId: string, schema: ModuleSchema): Promise<boolean> {
    try {
      await this.create('module_schemas', {
        moduleId,
        schema,
        createdAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      this.logger.error('Failed to create module schema', { moduleId, error });
      return false;
    }
  }

  async updateModuleSchema(moduleId: string, schema: ModuleSchema): Promise<boolean> {
    try {
      return await this.update('module_schemas', { moduleId }, {
        $set: {
          schema,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      this.logger.error('Failed to update module schema', { moduleId, error });
      return false;
    }
  }

  async deleteModuleSchema(moduleId: string): Promise<boolean> {
    try {
      return await this.delete('module_schemas', { moduleId });
    } catch (error) {
      this.logger.error('Failed to delete module schema', { moduleId, error });
      return false;
    }
  }

  // Create module-specific data service
  createModuleDataService(moduleId: string): ModuleDataServiceInterface {
    if (!this.moduleDataServices.has(moduleId)) {
      this.moduleDataServices.set(moduleId, new ModuleDataService(this, moduleId));
    }
    return this.moduleDataServices.get(moduleId)!;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private hasReadPermission(entity: ModuleEntity, userId: string): boolean {
    return entity._metadata.permissions.some(perm => 
      perm === `read:${userId}` || perm === 'read:public'
    );
  }

  private hasWritePermission(entity: ModuleEntity, userId: string): boolean {
    return entity._metadata.permissions.some(perm => 
      perm === `write:${userId}` || perm === 'write:public'
    );
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Module-specific data service wrapper
class ModuleDataService implements ModuleDataServiceInterface {
  constructor(
    private dataService: DataService,
    private moduleId: string
  ) {}

  async create<T = any>(moduleId: string, entityType: string, data: T): Promise<ModuleEntity<T>> {
    // Note: moduleId parameter is ignored, use the wrapped module's ID
    const entityId = await this.dataService.createModuleData(this.moduleId, entityType, data, 'system');
    
    return {
      _moduleId: this.moduleId,
      _entityType: entityType,
      _entityId: entityId,
      _version: 1,
      _metadata: {
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: ['read:system', 'write:system']
      },
      data
    };
  }

  async findById<T = any>(moduleId: string, entityType: string, id: string): Promise<ModuleEntity<T> | null> {
    const data = await this.dataService.getModuleData<T>(this.moduleId, entityType, id, 'system');
    if (!data) return null;

    return {
      _moduleId: this.moduleId,
      _entityType: entityType,
      _entityId: id,
      _version: 1,
      _metadata: {
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: ['read:system', 'write:system']
      },
      data
    };
  }

  async find<T = any>(moduleId: string, entityType: string, filter: DataFilter): Promise<ModuleEntity<T>[]> {
    const query: DataQuery = {
      filter: filter.where,
      limit: filter.limit,
      offset: filter.offset,
      sort: filter.sort
    };

    const results = await this.dataService.queryModuleData<T>(this.moduleId, entityType, query, 'system');
    
    return results.map((data, index) => ({
      _moduleId: this.moduleId,
      _entityType: entityType,
      _entityId: `entity-${index}`,
      _version: 1,
      _metadata: {
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        permissions: ['read:system', 'write:system']
      },
      data
    }));
  }

  async update<T = any>(moduleId: string, entityType: string, id: string, data: Partial<T>): Promise<ModuleEntity<T>> {
    await this.dataService.updateModuleData(this.moduleId, entityType, id, data, 'system');
    
    const updated = await this.findById<T>(moduleId, entityType, id);
    if (!updated) {
      throw new Error('Failed to retrieve updated entity');
    }
    
    return updated;
  }

  async delete(moduleId: string, entityType: string, id: string): Promise<boolean> {
    return await this.dataService.deleteModuleData(this.moduleId, entityType, id, 'system');
  }

  exposeData<T = any>(contract: any): void {
    this.dataService.registerDataContract(this.moduleId, contract);
  }

  async consumeData<T = any>(moduleId: string, contractName: string): Promise<any> {
    return await this.dataService.getDataContract(moduleId, contractName);
  }
}