/**
 * Core module system type definitions
 * These interfaces define how modules integrate with the platform
 */

// Module Manifest - defines what a module is and how it integrates
export interface ModuleManifest {
  name: string;
  version: string;
  displayName: string;
  description: string;
  type: 'core-module' | 'enhancement-module' | 'integration-module' | 'analysis-module';
  
  platform: {
    minVersion: string;
    maxVersion: string;
  };
  
  dependencies: {
    modules: string[];
    platform: PlatformService[];
  };
  
  permissions: Permission[];
  
  exports: {
    frontend?: string;
    backend?: string;
    schema?: string;
    routes?: string;
  };
  
  ui: {
    routes: UIRoute[];
    navigation: NavigationItem[];
    widgets: WidgetDefinition[];
  };
  
  events: {
    publishes: string[];
    subscribes: string[];
  };
}

// Platform Services that modules can depend on
export type PlatformService = 
  | 'data-service' 
  | 'event-bus' 
  | 'auth' 
  | 'storage' 
  | 'api-gateway'
  | 'ui-container';

// Permission system
export type Permission = 
  | DataPermission 
  | EventPermission 
  | UIPermission 
  | APIPermission;

export type DataPermission = `data:${string}:${DataAction}`;
export type EventPermission = `events:${string}:${EventAction}`;
export type UIPermission = `ui:${string}:${UIAction}`;
export type APIPermission = `api:${string}:${APIAction}`;

export type DataAction = 'read' | 'write' | 'delete' | 'admin';
export type EventAction = 'publish' | 'subscribe';
export type UIAction = 'register' | 'modify';
export type APIAction = 'access' | 'admin';

// UI Definitions
export interface UIRoute {
  path: string;
  component: string;
  guard?: string[];
}

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  position?: number;
  children?: NavigationItem[];
}

export interface WidgetDefinition {
  name: string;
  slot: 'dashboard' | 'sidebar' | 'header' | 'footer';
  position?: number;
  config?: Record<string, any>;
}

// Module Runtime Interfaces
export interface ModuleBackend {
  name: string;
  initialize(context: ModuleContext): Promise<void>;
  registerRoutes(router: ModuleRouter): void;
  registerEventHandlers(eventBus: EventBus): void;
  shutdown(): Promise<void>;
}

export interface ModuleFrontend {
  name: string;
  initialize(container: UIContainer): Promise<void>;
  registerComponents(): ComponentRegistry;
  registerRoutes(): UIRoute[];
  registerNavigation(): NavigationItem[];
  cleanup(): void;
}

// Module Context - what the platform provides to modules
export interface ModuleContext {
  dataService: DataService;
  eventBus: EventBus;
  logger: Logger;
  config: ModuleConfig;
  permissions: PermissionManager;
  storage: StorageService;
}

// Platform Service Interfaces
export interface DataService {
  create<T = any>(moduleId: string, entityType: string, data: T): Promise<ModuleEntity<T>>;
  findById<T = any>(moduleId: string, entityType: string, id: string): Promise<ModuleEntity<T> | null>;
  find<T = any>(moduleId: string, entityType: string, filter: DataFilter): Promise<ModuleEntity<T>[]>;
  update<T = any>(moduleId: string, entityType: string, id: string, data: Partial<T>): Promise<ModuleEntity<T>>;
  delete(moduleId: string, entityType: string, id: string): Promise<boolean>;
  
  // Inter-module data sharing
  exposeData<T = any>(contract: DataContract<T>): void;
  consumeData<T = any>(moduleId: string, contractName: string): Promise<DataContract<T> | null>;
}

export interface EventBus {
  publish<T = any>(event: string, data: T, metadata?: EventMetadata): Promise<void>;
  subscribe<T = any>(event: string, handler: (data: T, metadata: EventMetadata) => void): () => void;
  unsubscribe(event: string, handler: Function): void;
}

export interface PermissionManager {
  hasPermission(permission: Permission): boolean;
  requestPermission(permission: Permission): Promise<boolean>;
  revokePermission(permission: Permission): Promise<void>;
}

export interface StorageService {
  upload(file: Buffer, key: string, options?: StorageOptions): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}

// Data Models
export interface ModuleEntity<T = any> {
  _moduleId: string;
  _entityType: string;
  _entityId: string;
  _version: number;
  _metadata: EntityMetadata;
  data: T;
}

export interface EntityMetadata {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  permissions: string[];
  tags?: string[];
}

export interface DataFilter {
  where?: Record<string, any>;
  limit?: number;
  offset?: number;
  sort?: Record<string, 'asc' | 'desc'>;
}

export interface DataContract<T = any> {
  name: string;
  version: string;
  description: string;
  methods: {
    [key: string]: (...args: any[]) => Promise<T>;
  };
  events: string[];
}

// Event System
export interface EventMetadata {
  eventId: string;
  timestamp: string;
  source: string;
  correlationId?: string;
  userId?: string;
}

// Configuration
export interface ModuleConfig {
  [key: string]: any;
}

// Storage
export interface StorageOptions {
  contentType?: string;
  encryption?: boolean;
  compression?: boolean;
  metadata?: Record<string, string>;
}

// Routing and UI
export interface ModuleRouter {
  get(path: string, handler: RouteHandler): void;
  post(path: string, handler: RouteHandler): void;
  put(path: string, handler: RouteHandler): void;
  patch(path: string, handler: RouteHandler): void;
  delete(path: string, handler: RouteHandler): void;
  use(middleware: Middleware): void;
}

export type RouteHandler = (req: ModuleRequest, res: ModuleResponse) => Promise<void> | void;
export type Middleware = (req: ModuleRequest, res: ModuleResponse, next: () => void) => Promise<void> | void;

export interface ModuleRequest {
  params: Record<string, string>;
  query: Record<string, string>;
  body: any;
  headers: Record<string, string>;
  user?: any;
  moduleContext: ModuleContext;
}

export interface ModuleResponse {
  status(code: number): ModuleResponse;
  json(data: any): void;
  send(data: string): void;
  header(name: string, value: string): ModuleResponse;
}

export interface UIContainer {
  registerComponent(name: string, component: any): void;
  registerRoute(route: UIRoute): void;
  registerNavigation(nav: NavigationItem): void;
  getSharedState(): any;
  setSharedState(key: string, value: any): void;
}

export interface ComponentRegistry {
  [componentName: string]: any;
}

// Logger
export interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Module Lifecycle
export enum ModuleStatus {
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error',
  UPDATING = 'updating'
}

export interface ModuleInfo {
  manifest: ModuleManifest;
  status: ModuleStatus;
  installedVersion: string;
  enabledAt?: string;
  disabledAt?: string;
  error?: string;
}