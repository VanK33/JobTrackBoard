/**
 * Connection Pool Manager
 * Manages per-connection-string database connection pools
 * Allows multiple users to connect to different databases simultaneously
 */

import { DatabaseConfig } from './sqlite-service'
import { SQLiteService } from './sqlite-service'
import { PostgreSQLService } from './postgresql-service'
import { Logger } from '../utils/logger.js'

const logger = new Logger('ConnectionPoolManager')

interface PooledConnection {
  service: SQLiteService | PostgreSQLService
  lastUsed: Date
  connectionKey: string
}

export class ConnectionPoolManager {
  private static pools: Map<string, PooledConnection> = new Map()
  private static readonly MAX_IDLE_TIME = 30 * 60 * 1000 // 30 minutes
  private static cleanupInterval: NodeJS.Timeout | null = null

  /**
   * Generate a unique key for database configuration
   * Uses connection string as the primary key for pooling
   */
  private static generateConnectionKey(config: DatabaseConfig): string {
    if (config.connectionString) {
      // Use connection string as key (same connection string = same pool)
      return `connstr:${config.connectionString}`
    }

    // Fallback to composed key
    return `${config.type}:${config.host}:${config.port}:${config.database}:${config.username}`
  }

  /**
   * Get database type from config
   */
  private static getDatabaseType(config: DatabaseConfig): string {
    let databaseType = config.type
    if (config.connectionString) {
      const connectionStr = config.connectionString.toLowerCase()
      if (connectionStr.startsWith('postgresql://') || connectionStr.startsWith('postgres://')) {
        databaseType = 'postgresql'
      } else if (connectionStr.startsWith('mysql://')) {
        databaseType = 'mysql'
      } else if (connectionStr.startsWith('mongodb://') || connectionStr.startsWith('mongodb+srv://')) {
        databaseType = 'mongodb'
      }
    }
    return databaseType
  }

  /**
   * Get or create a database service for the given configuration
   */
  static async getConnection(config: DatabaseConfig): Promise<SQLiteService | PostgreSQLService> {
    const connectionKey = this.generateConnectionKey(config)

    // Check if we have an existing pooled connection
    const existing = this.pools.get(connectionKey)
    if (existing) {
      existing.lastUsed = new Date()
      logger.info('Reusing pooled database connection', { connectionKey })
      return existing.service
    }

    // Create new connection
    logger.info('Creating new database connection', {
      connectionKey,
      type: config.type
    })

    const databaseType = this.getDatabaseType(config)
    let service: SQLiteService | PostgreSQLService

    if (databaseType === 'postgresql') {
      service = new PostgreSQLService()
      if (config.connectionString) {
        await service.connectWithConnectionString(config.connectionString)
      } else {
        await service.connect(config)
      }
      await service.initialize()
    } else if (databaseType === 'sqlite') {
      service = new SQLiteService()
      await service.initialize()
    } else {
      throw new Error(`Unsupported database type: ${databaseType}`)
    }

    // Store in pool
    this.pools.set(connectionKey, {
      service,
      lastUsed: new Date(),
      connectionKey
    })

    // Start cleanup interval if not already started
    this.startCleanupInterval()

    return service
  }

  /**
   * Test connection without pooling
   */
  static async testConnection(config: DatabaseConfig): Promise<{
    connected: boolean
    error?: string
    tablesInitialized?: boolean
  }> {
    try {
      const databaseType = this.getDatabaseType(config)

      if (databaseType === 'postgresql') {
        const pgService = new PostgreSQLService()
        const result = await pgService.testConnection(config)
        await pgService.disconnect()
        return result
      } else if (databaseType === 'sqlite') {
        const sqliteService = new SQLiteService()
        return await sqliteService.testConnection(config)
      } else {
        return {
          connected: false,
          error: `Unsupported database type: ${databaseType}`
        }
      }
    } catch (error: any) {
      return {
        connected: false,
        error: error.message
      }
    }
  }

  /**
   * Start periodic cleanup of idle connections
   */
  private static startCleanupInterval(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections()
    }, 5 * 60 * 1000) // Check every 5 minutes
  }

  /**
   * Clean up idle connections
   */
  private static async cleanupIdleConnections(): Promise<void> {
    const now = new Date()
    const keysToRemove: string[] = []

    for (const [key, pooled] of this.pools.entries()) {
      const idleTime = now.getTime() - pooled.lastUsed.getTime()

      if (idleTime > this.MAX_IDLE_TIME) {
        keysToRemove.push(key)

        // Disconnect PostgreSQL connections
        if (pooled.service instanceof PostgreSQLService) {
          try {
            await pooled.service.disconnect()
            logger.info('Disconnected idle PostgreSQL connection', { connectionKey: key })
          } catch (error: any) {
            logger.error('Failed to disconnect idle connection', {
              connectionKey: key,
              error: error.message
            })
          }
        }
      }
    }

    // Remove from pool
    keysToRemove.forEach(key => this.pools.delete(key))

    if (keysToRemove.length > 0) {
      logger.info('Cleaned up idle connections', { count: keysToRemove.length })
    }
  }

  /**
   * Close all connections (for graceful shutdown)
   */
  static async closeAll(): Promise<void> {
    logger.info('Closing all database connections', { count: this.pools.size })

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    const closePromises: Promise<void>[] = []

    for (const [key, pooled] of this.pools.entries()) {
      if (pooled.service instanceof PostgreSQLService) {
        closePromises.push(
          pooled.service.disconnect().catch(error => {
            logger.error('Failed to close connection', {
              connectionKey: key,
              error: error.message
            })
          })
        )
      }
    }

    await Promise.all(closePromises)
    this.pools.clear()
    logger.info('All database connections closed')
  }

  /**
   * Get pool statistics
   */
  static getStats(): { totalConnections: number; connections: string[] } {
    return {
      totalConnections: this.pools.size,
      connections: Array.from(this.pools.keys())
    }
  }
}
