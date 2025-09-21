/**
 * Platform-specific type definitions
 * These define the core services provided by the platform
 */

import { ModuleManifest, ModuleInfo, ModuleStatus, ModuleContext, EventMetadata, RouteHandler, Middleware, NavigationItem, UIRoute, StorageOptions } from './module.js';

// Platform Core Services
export interface PlatformCore {
  moduleManager: ModuleManager;
  eventBus: PlatformEventBus;
  authService: AuthService;
  dataService: PlatformDataService;
  storageService: PlatformStorageService;
  apiGateway: APIGateway;
  uiContainer: PlatformUIContainer;
}

// Module Management
export interface ModuleManager {
  install(modulePackage: ModulePackage): Promise<ModuleInfo>;
  uninstall(moduleId: string): Promise<boolean>;
  enable(moduleId: string): Promise<boolean>;
  disable(moduleId: string): Promise<boolean>;
  update(moduleId: string, newVersion: string): Promise<ModuleInfo>;
  
  getModule(moduleId: string): Promise<ModuleInfo | null>;
  listModules(filter?: ModuleFilter): Promise<ModuleInfo[]>;
  getEnabledModules(): Promise<ModuleInfo[]>;
  
  validateDependencies(manifest: ModuleManifest): Promise<ValidationResult>;
  resolveDependencies(moduleId: string): Promise<string[]>;
}

export interface ModulePackage {
  manifest: ModuleManifest;
  frontend?: ModuleAsset;
  backend?: ModuleAsset;
  assets?: ModuleAsset[];
}

export interface ModuleAsset {
  name: string;
  content: Buffer;
  type: 'js' | 'css' | 'json' | 'other';
}

export interface ModuleFilter {
  status?: ModuleStatus;
  type?: string;
  search?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Authentication & Authorization
export interface AuthService {
  authenticate(credentials: LoginCredentials): Promise<AuthResult>;
  authorize(userId: string, permission: string): Promise<boolean>;
  createUser(userData: CreateUserData): Promise<User>;
  getUser(userId: string): Promise<User | null>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Session management
  createSession(userId: string): Promise<SessionInfo>;
  validateSession(sessionToken: string): Promise<SessionInfo | null>;
  destroySession(sessionToken: string): Promise<boolean>;
  
  // Permission management
  grantPermission(userId: string, permission: string): Promise<boolean>;
  revokePermission(userId: string, permission: string): Promise<boolean>;
  getUserPermissions(userId: string): Promise<string[]>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  preferences?: UserPreferences;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  modules: ModulePreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface ModulePreferences {
  enabledModules: string[];
  moduleSettings: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: SessionInfo;
  error?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  token: string;
}

// Data Service
export interface PlatformDataService {
  // Database operations
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  
  // Module data management
  createModuleData<T>(moduleId: string, entityType: string, data: T, userId: string): Promise<string>;
  getModuleData<T>(moduleId: string, entityType: string, id: string, userId: string): Promise<T | null>;
  updateModuleData<T>(moduleId: string, entityType: string, id: string, data: Partial<T>, userId: string): Promise<boolean>;
  deleteModuleData(moduleId: string, entityType: string, id: string, userId: string): Promise<boolean>;
  queryModuleData<T>(moduleId: string, entityType: string, query: DataQuery, userId: string): Promise<T[]>;
  
  // Cross-module data sharing
  registerDataContract(moduleId: string, contract: any): Promise<boolean>;
  getDataContract(moduleId: string, contractName: string): Promise<any>;
  
  // Schema management
  createModuleSchema(moduleId: string, schema: ModuleSchema): Promise<boolean>;
  updateModuleSchema(moduleId: string, schema: ModuleSchema): Promise<boolean>;
  deleteModuleSchema(moduleId: string): Promise<boolean>;
}

export interface DataQuery {
  filter?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
  limit?: number;
  offset?: number;
  include?: string[];
}

export interface ModuleSchema {
  entities: Record<string, EntitySchema>;
  relationships: Relationship[];
}

export interface EntitySchema {
  name: string;
  fields: Record<string, FieldSchema>;
  indexes: IndexSchema[];
}

export interface FieldSchema {
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  required?: boolean;
  unique?: boolean;
  default?: any;
  validation?: ValidationSchema;
}

export interface ValidationSchema {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: any[];
}

export interface IndexSchema {
  fields: string[];
  unique?: boolean;
  sparse?: boolean;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  field: string;
}

// Event Bus
export interface PlatformEventBus {
  publish(event: PlatformEvent): Promise<boolean>;
  subscribe(pattern: string, handler: EventHandler): string;
  unsubscribe(subscriptionId: string): boolean;
  
  // Event filtering and routing
  createEventFilter(moduleId: string, filter: EventFilter): string;
  removeEventFilter(filterId: string): boolean;
  
  // Event history and replay
  getEventHistory(filter: EventHistoryFilter): Promise<PlatformEvent[]>;
  replayEvents(filter: EventHistoryFilter): Promise<boolean>;
}

export interface PlatformEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  data: any;
  metadata: EventMetadata;
}

// EventMetadata is defined in module.ts

export interface EventFilter {
  patterns: string[];
  moduleId: string;
  permissions: string[];
}

export interface EventHistoryFilter {
  types?: string[];
  sources?: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  limit?: number;
}

export type EventHandler = (event: PlatformEvent) => Promise<void> | void;

// Storage Service
export interface PlatformStorageService {
  // File operations
  upload(file: FileUpload, options?: StorageOptions): Promise<StorageResult>;
  download(fileId: string): Promise<FileDownload>;
  delete(fileId: string): Promise<boolean>;
  getMetadata(fileId: string): Promise<FileMetadata>;
  
  // Storage providers
  addProvider(provider: StorageProvider): Promise<boolean>;
  removeProvider(providerId: string): Promise<boolean>;
  setDefaultProvider(providerId: string): Promise<boolean>;
  
  // Migration
  migrateFiles(fromProvider: string, toProvider: string): Promise<MigrationResult>;
}

export interface FileUpload {
  filename: string;
  content: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface FileDownload {
  filename: string;
  content: Buffer;
  contentType: string;
  metadata: Record<string, string>;
}

export interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  uploadedBy: string;
  provider: string;
  metadata: Record<string, string>;
}

// StorageOptions is defined in module.ts

export interface StorageResult {
  fileId: string;
  url: string;
  provider: string;
}

export interface StorageProvider {
  id: string;
  name: string;
  type: 'aws-s3' | 'google-cloud' | 'azure-blob' | 'local';
  config: Record<string, any>;
  enabled: boolean;
}

export interface MigrationResult {
  success: boolean;
  migratedFiles: number;
  failedFiles: number;
  errors: string[];
}

// API Gateway
export interface APIGateway {
  registerModuleRoutes(moduleId: string, routes: ModuleRoute[]): Promise<boolean>;
  unregisterModuleRoutes(moduleId: string): Promise<boolean>;
  
  // Rate limiting
  setRateLimit(moduleId: string, limits: RateLimit): Promise<boolean>;
  
  // Authentication middleware
  requireAuth(handler: RouteHandler): RouteHandler;
  requirePermission(permission: string): (handler: RouteHandler) => RouteHandler;
}

export interface ModuleRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: RouteHandler;
  middleware?: Middleware[];
  permissions?: string[];
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  burst?: number;
}

// RouteHandler and Middleware are defined in module.ts

// UI Container
export interface PlatformUIContainer {
  // Component management
  registerComponent(moduleId: string, component: UIComponent): Promise<boolean>;
  unregisterComponent(moduleId: string, componentName: string): Promise<boolean>;
  
  // Route management
  registerRoute(moduleId: string, route: UIRoute): Promise<boolean>;
  unregisterRoute(moduleId: string, path: string): Promise<boolean>;
  
  // Navigation
  registerNavigation(moduleId: string, nav: NavigationItem): Promise<boolean>;
  updateNavigation(): Promise<boolean>;
  
  // Shared state
  getSharedState(key: string): any;
  setSharedState(key: string, value: any): Promise<boolean>;
  subscribeToState(key: string, callback: (value: any) => void): () => void;
}

export interface UIComponent {
  name: string;
  component: any;
  props?: Record<string, any>;
  permissions?: string[];
}

// UIRoute is defined in module.ts

// NavigationItem is defined in module.ts

// Platform Configuration
export interface PlatformConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  storage: StorageConfig;
  auth: AuthConfig;
  modules: ModulesConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  security: {
    helmet: boolean;
    rateLimiting: boolean;
  };
}

export interface DatabaseConfig {
  url: string;
  name: string;
  options: Record<string, any>;
}

export interface RedisConfig {
  url: string;
  options: Record<string, any>;
}

export interface StorageConfig {
  defaultProvider: string;
  providers: StorageProvider[];
}

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
  };
  session: {
    ttl: number;
  };
  password: {
    minLength: number;
    requireSpecialChars: boolean;
  };
}

export interface ModulesConfig {
  directory: string;
  registry: string;
  autoEnable: boolean;
  maxConcurrentInstalls: number;
}