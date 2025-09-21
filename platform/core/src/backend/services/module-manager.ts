/**
 * Module Manager - Core service for managing module lifecycle
 * This is the "brain" of the modular platform
 */

import { promises as fs } from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import {
  ModuleManager,
  ModuleManifest,
  ModuleInfo,
  ModuleStatus,
  ModulePackage,
  ModuleFilter,
  ValidationResult,
  ModuleBackend,
  ModuleContext
} from '../../../../../shared/types/src/index.js';
import { Logger } from '../utils/logger.js';
import { DataService } from './data-service.js';
import { EventBusService } from './event-bus.js';
import { AuthService } from './auth-service.js';
import { StorageService } from './storage-service.js';

export class ModuleManagerService extends EventEmitter implements ModuleManager {
  private modules = new Map<string, ModuleInfo>();
  private loadedModules = new Map<string, ModuleBackend>();
  private moduleDirectory: string;
  private logger: Logger;

  constructor(
    private dataService: DataService,
    private eventBus: EventBusService,
    private authService: AuthService,
    private storageService: StorageService,
    moduleDirectory: string = './modules'
  ) {
    super();
    this.moduleDirectory = moduleDirectory;
    this.logger = new Logger('ModuleManager');
    
    // Initialize modules collection in database
    this.initializeModulesCollection();
  }

  private async initializeModulesCollection(): Promise<void> {
    try {
      await this.dataService.createCollection('platform_modules', {
        moduleId: { type: 'string', unique: true },
        manifest: { type: 'object' },
        status: { type: 'string' },
        installedVersion: { type: 'string' },
        enabledAt: { type: 'string', optional: true },
        disabledAt: { type: 'string', optional: true },
        error: { type: 'string', optional: true }
      });
    } catch (error) {
      this.logger.debug('Modules collection already exists or creation failed', { error });
    }
  }

  async install(modulePackage: ModulePackage): Promise<ModuleInfo> {
    const { manifest } = modulePackage;
    const moduleId = manifest.name;

    this.logger.info('Installing module', { moduleId, version: manifest.version });

    try {
      // Validate module manifest
      const validation = await this.validateManifest(manifest);
      if (!validation.valid) {
        throw new Error(`Module validation failed: ${validation.errors.join(', ')}`);
      }

      // Check dependencies
      const depValidation = await this.validateDependencies(manifest);
      if (!depValidation.valid) {
        throw new Error(`Dependency validation failed: ${depValidation.errors.join(', ')}`);
      }

      // Check if module already exists
      const existing = await this.getModule(moduleId);
      if (existing) {
        throw new Error(`Module ${moduleId} is already installed`);
      }

      // Create module directory
      const modulePath = path.join(this.moduleDirectory, moduleId);
      await fs.mkdir(modulePath, { recursive: true });

      // Save module files
      if (modulePackage.backend) {
        await fs.writeFile(
          path.join(modulePath, 'backend.js'),
          modulePackage.backend.content
        );
      }

      if (modulePackage.frontend) {
        await fs.writeFile(
          path.join(modulePath, 'frontend.js'),
          modulePackage.frontend.content
        );
      }

      // Save manifest
      await fs.writeFile(
        path.join(modulePath, 'module.json'),
        JSON.stringify(manifest, null, 2)
      );

      // Save additional assets
      if (modulePackage.assets) {
        for (const asset of modulePackage.assets) {
          await fs.writeFile(
            path.join(modulePath, asset.name),
            asset.content
          );
        }
      }

      // Create module info
      const moduleInfo: ModuleInfo = {
        manifest,
        status: ModuleStatus.INSTALLED,
        installedVersion: manifest.version
      };

      // Save to database
      await this.dataService.create('platform_modules', {
        moduleId,
        manifest,
        status: ModuleStatus.INSTALLED,
        installedVersion: manifest.version,
        installedAt: new Date().toISOString()
      });

      // Update in-memory store
      this.modules.set(moduleId, moduleInfo);

      this.logger.info('Module installed successfully', { moduleId });
      this.emit('module:installed', { moduleId, moduleInfo });

      return moduleInfo;

    } catch (error) {
      this.logger.error('Failed to install module', { moduleId, error: error.message });
      throw error;
    }
  }

  async uninstall(moduleId: string): Promise<boolean> {
    this.logger.info('Uninstalling module', { moduleId });

    try {
      const moduleInfo = await this.getModule(moduleId);
      if (!moduleInfo) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // Disable module if enabled
      if (moduleInfo.status === ModuleStatus.ENABLED) {
        await this.disable(moduleId);
      }

      // Check for dependent modules
      const dependents = await this.findDependentModules(moduleId);
      if (dependents.length > 0) {
        throw new Error(`Cannot uninstall ${moduleId}: modules ${dependents.join(', ')} depend on it`);
      }

      // Remove module files
      const modulePath = path.join(this.moduleDirectory, moduleId);
      await fs.rm(modulePath, { recursive: true, force: true });

      // Remove from database
      await this.dataService.delete('platform_modules', { moduleId });

      // Update in-memory store
      this.modules.delete(moduleId);

      this.logger.info('Module uninstalled successfully', { moduleId });
      this.emit('module:uninstalled', { moduleId });

      return true;

    } catch (error) {
      this.logger.error('Failed to uninstall module', { moduleId, error: error.message });
      throw error;
    }
  }

  async enable(moduleId: string): Promise<boolean> {
    this.logger.info('Enabling module', { moduleId });

    try {
      const moduleInfo = await this.getModule(moduleId);
      if (!moduleInfo) {
        throw new Error(`Module ${moduleId} not found`);
      }

      if (moduleInfo.status === ModuleStatus.ENABLED) {
        this.logger.warn('Module already enabled', { moduleId });
        return true;
      }

      // Validate dependencies are enabled
      const depValidation = await this.validateDependencies(moduleInfo.manifest);
      if (!depValidation.valid) {
        throw new Error(`Dependencies not satisfied: ${depValidation.errors.join(', ')}`);
      }

      // Load module backend
      const moduleBackend = await this.loadModuleBackend(moduleId);
      if (moduleBackend) {
        // Create module context
        const context = this.createModuleContext(moduleId);
        
        // Initialize module
        await moduleBackend.initialize(context);
        
        // Register event handlers
        moduleBackend.registerEventHandlers(this.eventBus);
        
        // Store loaded module
        this.loadedModules.set(moduleId, moduleBackend);
      }

      // Update status
      moduleInfo.status = ModuleStatus.ENABLED;
      moduleInfo.enabledAt = new Date().toISOString();
      delete moduleInfo.disabledAt;
      delete moduleInfo.error;

      // Update database
      await this.dataService.update('platform_modules', { moduleId }, {
        status: ModuleStatus.ENABLED,
        enabledAt: moduleInfo.enabledAt,
        $unset: { disabledAt: 1, error: 1 }
      });

      this.logger.info('Module enabled successfully', { moduleId });
      this.emit('module:enabled', { moduleId, moduleInfo });

      return true;

    } catch (error) {
      this.logger.error('Failed to enable module', { moduleId, error: error.message });
      
      // Update error status
      const moduleInfo = this.modules.get(moduleId);
      if (moduleInfo) {
        moduleInfo.status = ModuleStatus.ERROR;
        moduleInfo.error = error.message;
        
        await this.dataService.update('platform_modules', { moduleId }, {
          status: ModuleStatus.ERROR,
          error: error.message
        });
      }

      throw error;
    }
  }

  async disable(moduleId: string): Promise<boolean> {
    this.logger.info('Disabling module', { moduleId });

    try {
      const moduleInfo = await this.getModule(moduleId);
      if (!moduleInfo) {
        throw new Error(`Module ${moduleId} not found`);
      }

      if (moduleInfo.status !== ModuleStatus.ENABLED) {
        this.logger.warn('Module not enabled', { moduleId });
        return true;
      }

      // Check for dependent modules
      const dependents = await this.findEnabledDependentModules(moduleId);
      if (dependents.length > 0) {
        throw new Error(`Cannot disable ${moduleId}: enabled modules ${dependents.join(', ')} depend on it`);
      }

      // Shutdown module backend
      const moduleBackend = this.loadedModules.get(moduleId);
      if (moduleBackend) {
        await moduleBackend.shutdown();
        this.loadedModules.delete(moduleId);
      }

      // Update status
      moduleInfo.status = ModuleStatus.DISABLED;
      moduleInfo.disabledAt = new Date().toISOString();
      delete moduleInfo.enabledAt;
      delete moduleInfo.error;

      // Update database
      await this.dataService.update('platform_modules', { moduleId }, {
        status: ModuleStatus.DISABLED,
        disabledAt: moduleInfo.disabledAt,
        $unset: { enabledAt: 1, error: 1 }
      });

      this.logger.info('Module disabled successfully', { moduleId });
      this.emit('module:disabled', { moduleId, moduleInfo });

      return true;

    } catch (error) {
      this.logger.error('Failed to disable module', { moduleId, error: error.message });
      throw error;
    }
  }

  async update(moduleId: string, newVersion: string): Promise<ModuleInfo> {
    this.logger.info('Updating module', { moduleId, newVersion });

    try {
      const currentModule = await this.getModule(moduleId);
      if (!currentModule) {
        throw new Error(`Module ${moduleId} not found`);
      }

      // For now, update means uninstall and reinstall
      // In a real implementation, you'd have more sophisticated update logic
      const wasEnabled = currentModule.status === ModuleStatus.ENABLED;

      // This would load the new module package from a registry
      // For now, we'll throw an error indicating this needs implementation
      throw new Error('Module updates not yet implemented - please uninstall and reinstall');

    } catch (error) {
      this.logger.error('Failed to update module', { moduleId, error: error.message });
      throw error;
    }
  }

  async getModule(moduleId: string): Promise<ModuleInfo | null> {
    // Check in-memory first
    const cached = this.modules.get(moduleId);
    if (cached) {
      return cached;
    }

    // Check database
    const dbModule = await this.dataService.findOne('platform_modules', { moduleId });
    if (dbModule) {
      const moduleInfo: ModuleInfo = {
        manifest: dbModule.manifest,
        status: dbModule.status,
        installedVersion: dbModule.installedVersion,
        enabledAt: dbModule.enabledAt,
        disabledAt: dbModule.disabledAt,
        error: dbModule.error
      };
      
      this.modules.set(moduleId, moduleInfo);
      return moduleInfo;
    }

    return null;
  }

  async listModules(filter?: ModuleFilter): Promise<ModuleInfo[]> {
    const query: any = {};
    
    if (filter?.status) {
      query.status = filter.status;
    }
    
    if (filter?.type) {
      query['manifest.type'] = filter.type;
    }

    if (filter?.search) {
      query.$or = [
        { 'manifest.name': { $regex: filter.search, $options: 'i' } },
        { 'manifest.displayName': { $regex: filter.search, $options: 'i' } },
        { 'manifest.description': { $regex: filter.search, $options: 'i' } }
      ];
    }

    const dbModules = await this.dataService.find('platform_modules', query);
    
    return dbModules.map(dbModule => ({
      manifest: dbModule.manifest,
      status: dbModule.status,
      installedVersion: dbModule.installedVersion,
      enabledAt: dbModule.enabledAt,
      disabledAt: dbModule.disabledAt,
      error: dbModule.error
    }));
  }

  async getEnabledModules(): Promise<ModuleInfo[]> {
    return this.listModules({ status: ModuleStatus.ENABLED });
  }

  async validateDependencies(manifest: ModuleManifest): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check platform dependencies
    for (const platformService of manifest.dependencies.platform) {
      if (!this.isPlatformServiceAvailable(platformService)) {
        errors.push(`Platform service '${platformService}' is not available`);
      }
    }

    // Check module dependencies
    for (const dependencyModuleId of manifest.dependencies.modules) {
      const dependencyModule = await this.getModule(dependencyModuleId);
      if (!dependencyModule) {
        errors.push(`Required module '${dependencyModuleId}' is not installed`);
      } else if (dependencyModule.status !== ModuleStatus.ENABLED) {
        errors.push(`Required module '${dependencyModuleId}' is not enabled`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  async resolveDependencies(moduleId: string): Promise<string[]> {
    const moduleInfo = await this.getModule(moduleId);
    if (!moduleInfo) {
      throw new Error(`Module ${moduleId} not found`);
    }

    const dependencies = new Set<string>();
    const queue = [moduleId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentModuleId = queue.shift()!;
      if (visited.has(currentModuleId)) {
        continue;
      }
      visited.add(currentModuleId);

      const currentModule = await this.getModule(currentModuleId);
      if (!currentModule) {
        continue;
      }

      for (const dep of currentModule.manifest.dependencies.modules) {
        dependencies.add(dep);
        queue.push(dep);
      }
    }

    // Remove the original module from dependencies
    dependencies.delete(moduleId);
    
    return Array.from(dependencies);
  }

  private async validateManifest(manifest: ModuleManifest): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!manifest.name) errors.push('Module name is required');
    if (!manifest.version) errors.push('Module version is required');
    if (!manifest.displayName) errors.push('Module display name is required');
    if (!manifest.type) errors.push('Module type is required');

    // Version format validation
    if (manifest.version && !/^\d+\.\d+\.\d+/.test(manifest.version)) {
      errors.push('Module version must follow semantic versioning (e.g., 1.0.0)');
    }

    // Name validation
    if (manifest.name && !/^[a-z0-9-]+$/.test(manifest.name)) {
      errors.push('Module name must contain only lowercase letters, numbers, and hyphens');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async loadModuleBackend(moduleId: string): Promise<ModuleBackend | null> {
    try {
      const modulePath = path.join(this.moduleDirectory, moduleId, 'backend.js');
      
      // Check if backend file exists
      try {
        await fs.access(modulePath);
      } catch {
        this.logger.debug('No backend file found for module', { moduleId });
        return null;
      }

      // Dynamic import of the module
      const moduleExports = await import(modulePath);
      const ModuleClass = moduleExports.default || moduleExports.ModuleBackend;
      
      if (!ModuleClass) {
        throw new Error(`No default export or ModuleBackend export found in ${modulePath}`);
      }

      return new ModuleClass();

    } catch (error) {
      this.logger.error('Failed to load module backend', { moduleId, error: error.message });
      throw error;
    }
  }

  private createModuleContext(moduleId: string): ModuleContext {
    return {
      dataService: this.dataService.createModuleDataService(moduleId),
      eventBus: this.eventBus.createModuleEventBus(moduleId),
      logger: new Logger(`Module:${moduleId}`),
      config: this.getModuleConfig(moduleId),
      permissions: this.authService.createModulePermissionManager(moduleId),
      storage: this.storageService.createModuleStorageService(moduleId)
    };
  }

  private getModuleConfig(moduleId: string): any {
    // Load module-specific configuration
    // This could be from database, config files, environment variables, etc.
    return {};
  }

  private isPlatformServiceAvailable(serviceName: string): boolean {
    const availableServices = [
      'data-service',
      'event-bus', 
      'auth',
      'storage',
      'api-gateway',
      'ui-container'
    ];
    return availableServices.includes(serviceName);
  }

  private async findDependentModules(moduleId: string): Promise<string[]> {
    const allModules = await this.listModules();
    return allModules
      .filter(module => module.manifest.dependencies.modules.includes(moduleId))
      .map(module => module.manifest.name);
  }

  private async findEnabledDependentModules(moduleId: string): Promise<string[]> {
    const dependents = await this.findDependentModules(moduleId);
    const enabledDependents: string[] = [];

    for (const dependentId of dependents) {
      const dependent = await this.getModule(dependentId);
      if (dependent && dependent.status === ModuleStatus.ENABLED) {
        enabledDependents.push(dependentId);
      }
    }

    return enabledDependents;
  }
}