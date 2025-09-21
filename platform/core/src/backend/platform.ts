/**
 * Platform Core - Main bootstrap class that initializes all platform services
 * This is the "motherboard" that provides infrastructure for all modules
 */

import { EventEmitter } from 'events';
import { Logger } from './utils/logger.js';
import { PlatformCore, PlatformConfig } from '../../../../shared/types/src/index.js';

// Import all platform services
import { DataService } from './services/data-service.js';
import { EventBusService } from './services/event-bus.js';
import { AuthenticationService } from './services/auth-service.js';
import { StorageService } from './services/storage-service.js';
import { ModuleManagerService } from './services/module-manager.js';

export class Platform extends EventEmitter implements PlatformCore {
  private logger: Logger;
  private initialized = false;
  private shutdownSignals = ['SIGINT', 'SIGTERM'];

  // Platform services
  public readonly moduleManager: ModuleManagerService;
  public readonly eventBus: EventBusService;
  public readonly authService: AuthenticationService;
  public readonly dataService: DataService;
  public readonly storageService: StorageService;
  public readonly apiGateway: any; // Will implement later
  public readonly uiContainer: any; // Will implement later

  constructor(private config: PlatformConfig) {
    super();
    this.logger = new Logger('Platform');

    // Initialize core services
    this.dataService = new DataService(
      this.config.database.url,
      this.config.database.name
    );

    this.eventBus = new EventBusService(this.config.redis?.url);

    this.authService = new AuthenticationService(
      this.dataService,
      this.config.auth.jwt.secret
    );

    this.storageService = new StorageService(
      this.dataService,
      this.config.storage?.defaultProvider || './storage'
    );

    this.moduleManager = new ModuleManagerService(
      this.dataService,
      this.eventBus,
      this.authService,
      this.storageService,
      this.config.modules?.directory || './modules'
    );

    // Setup graceful shutdown
    this.setupGracefulShutdown();
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Platform already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Modular Job Tracker Platform');

      // Initialize services in order
      await this.initializeServices();

      // Load and enable modules
      await this.loadModules();

      this.initialized = true;
      this.emit('platform:initialized');
      
      this.logger.info('Platform initialization completed successfully');

    } catch (error) {
      this.logger.error('Platform initialization failed', { error: error.message });
      this.emit('platform:error', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      this.logger.info('Shutting down platform');

      // Disable all modules first
      await this.shutdownModules();

      // Shutdown services in reverse order
      await this.shutdownServices();

      this.initialized = false;
      this.emit('platform:shutdown');
      
      this.logger.info('Platform shutdown completed');

    } catch (error) {
      this.logger.error('Platform shutdown failed', { error: error.message });
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): PlatformConfig {
    return { ...this.config };
  }

  private async initializeServices(): Promise<void> {
    this.logger.info('Initializing platform services');

    // Connect to database
    const dbConnected = await this.dataService.connect();
    if (!dbConnected) {
      throw new Error('Failed to connect to database');
    }

    // Initialize event bus
    await this.eventBus.initialize();

    // Setup service event handlers
    this.setupServiceEventHandlers();

    this.logger.info('Platform services initialized successfully');
  }

  private async shutdownServices(): Promise<void> {
    this.logger.info('Shutting down platform services');

    // Shutdown in reverse order
    await this.eventBus.shutdown();
    await this.dataService.disconnect();

    this.logger.info('Platform services shut down successfully');
  }

  private async loadModules(): Promise<void> {
    try {
      this.logger.info('Loading installed modules');

      // Get all installed modules
      const modules = await this.moduleManager.listModules();
      
      this.logger.info(`Found ${modules.length} installed modules`);

      // Auto-enable modules if configured
      if (this.config.modules?.autoEnable) {
        for (const module of modules) {
          if (module.status === 'installed') {
            try {
              await this.moduleManager.enable(module.manifest.name);
              this.logger.info(`Auto-enabled module: ${module.manifest.name}`);
            } catch (error) {
              this.logger.error(`Failed to auto-enable module: ${module.manifest.name}`, { 
                error: error.message 
              });
            }
          }
        }
      }

      const enabledModules = await this.moduleManager.getEnabledModules();
      this.logger.info(`${enabledModules.length} modules enabled and running`);

    } catch (error) {
      this.logger.error('Failed to load modules', { error: error.message });
      // Don't throw here - platform should start even if modules fail
    }
  }

  private async shutdownModules(): Promise<void> {
    try {
      this.logger.info('Shutting down modules');

      const enabledModules = await this.moduleManager.getEnabledModules();
      
      for (const module of enabledModules) {
        try {
          await this.moduleManager.disable(module.manifest.name);
          this.logger.debug(`Disabled module: ${module.manifest.name}`);
        } catch (error) {
          this.logger.error(`Failed to disable module: ${module.manifest.name}`, { 
            error: error.message 
          });
        }
      }

      this.logger.info('Modules shutdown completed');

    } catch (error) {
      this.logger.error('Failed to shutdown modules', { error: error.message });
    }
  }

  private setupServiceEventHandlers(): void {
    // Module Manager events
    this.moduleManager.on('module:installed', (event) => {
      this.logger.info('Module installed', { moduleId: event.moduleId });
      this.emit('module:installed', event);
    });

    this.moduleManager.on('module:enabled', (event) => {
      this.logger.info('Module enabled', { moduleId: event.moduleId });
      this.emit('module:enabled', event);
    });

    this.moduleManager.on('module:disabled', (event) => {
      this.logger.info('Module disabled', { moduleId: event.moduleId });
      this.emit('module:disabled', event);
    });

    this.moduleManager.on('module:uninstalled', (event) => {
      this.logger.info('Module uninstalled', { moduleId: event.moduleId });
      this.emit('module:uninstalled', event);
    });

    // Event Bus events
    this.eventBus.on('error', (error) => {
      this.logger.error('Event bus error', { error: error.message });
    });
  }

  private setupGracefulShutdown(): void {
    this.shutdownSignals.forEach(signal => {
      process.on(signal, async () => {
        this.logger.info(`Received ${signal}, starting graceful shutdown`);
        
        try {
          await this.shutdown();
          process.exit(0);
        } catch (error) {
          this.logger.error('Graceful shutdown failed', { error: error.message });
          process.exit(1);
        }
      });
    });

    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled rejection', { reason, promise });
      process.exit(1);
    });
  }
}

// Default configuration
export const defaultConfig: PlatformConfig = {
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true
    },
    security: {
      helmet: true,
      rateLimiting: true
    }
  },
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017',
    name: process.env.DATABASE_NAME || 'job_tracker',
    options: {}
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    options: {}
  },
  storage: {
    defaultProvider: 'local',
    providers: [
      {
        id: 'local',
        name: 'Local Storage',
        type: 'local',
        config: {
          path: './storage'
        },
        enabled: true
      }
    ]
  },
  auth: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: '24h'
    },
    session: {
      ttl: 24 * 60 * 60 * 1000 // 24 hours
    },
    password: {
      minLength: 8,
      requireSpecialChars: true
    }
  },
  modules: {
    directory: './modules',
    registry: process.env.MODULE_REGISTRY || 'http://localhost:4000',
    autoEnable: true,
    maxConcurrentInstalls: 3
  }
};

// Factory function to create platform with custom config
export function createPlatform(customConfig?: Partial<PlatformConfig>): Platform {
  const config = { ...defaultConfig, ...customConfig };
  return new Platform(config);
}