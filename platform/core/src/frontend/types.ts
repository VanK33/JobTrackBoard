export interface ModuleInfo {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  type: 'core-module' | 'enhancement-module' | 'integration-module'
  category: 'tracking' | 'analysis' | 'automation' | 'integration'
  icon?: string
  screenshots?: string[]
  features: string[]
  dependencies?: string[]
  permissions?: string[]
  author?: string
  rating?: number
  downloadCount?: number
  lastUpdated?: string
}

export interface InstalledModule {
  id: string
  name: string
  displayName: string
  version: string
  enabled: boolean
  status: 'active' | 'inactive' | 'error'
  position?: {
    x: number
    y: number
  }
}

export interface ModuleCard {
  module: ModuleInfo
  isInstalled: boolean
  onInstall: (moduleId: string) => void
  onUninstall: (moduleId: string) => void
}

export interface WorkspaceModule extends InstalledModule {
  component?: React.ComponentType<any>
}

// Database Configuration Types
export interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'mongodb'
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  connectionString?: string
}

export interface DatabaseProvider {
  id: string
  name: string
  description: string
  freeLimit: string
  setupComplexity: 'Easy' | 'Medium' | 'Advanced'
  recommendedFor: string[]
  logo: string
  signupUrl: string
  docsUrl: string
  type: 'postgresql' | 'mysql' | 'mongodb'
}

export interface DatabaseStatus {
  connected: boolean
  lastChecked?: string
  error?: string
  tablesInitialized?: boolean
}

// Named Connection Types (Feature 014)
export interface NamedConnection {
  name: string
  connectionString: string
  createdAt?: string
}