/**
 * Database Configuration Middleware
 * Extracts database configuration from request headers and attaches to request
 */

import { Request, Response, NextFunction } from 'express'
import { DatabaseConfig } from '../services/sqlite-service.js'
import { Logger } from '../utils/logger.js'

const logger = new Logger('DatabaseConfigMiddleware')
const DB_CONFIG_HEADER = 'x-database-config'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      dbConfig?: DatabaseConfig
    }
  }
}

/**
 * Extract and parse database configuration from request headers
 */
export function extractDatabaseConfig(req: Request, res: Response, next: NextFunction): void {
  try {
    // Skip static assets and health check
    const isStaticAsset = req.path.startsWith('/assets/') ||
                          req.path.startsWith('/storage/') ||
                          req.path === '/health' ||
                          req.path === '/favicon.ico'

    if (isStaticAsset) {
      return next()
    }

    const configHeader = req.headers[DB_CONFIG_HEADER] as string

    if (configHeader) {
      // Decode from base64
      const decoded = Buffer.from(configHeader, 'base64').toString('utf-8')
      const config: DatabaseConfig = JSON.parse(decoded)

      // Attach to request
      req.dbConfig = config

      logger.info('Database config extracted from request', {
        type: config.type,
        hasConnectionString: !!config.connectionString,
        path: req.path
      })
    } else if (req.path.startsWith('/api/')) {
      // Only warn for API endpoints
      logger.warn('No database config in request headers', { path: req.path })
    }
  } catch (error: any) {
    logger.error('Failed to parse database config from headers', {
      error: error.message,
      path: req.path
    })
  }

  next()
}

/**
 * Require database configuration to be present
 * Returns 400 if no config found
 */
export function requireDatabaseConfig(req: Request, res: Response, next: NextFunction): void {
  if (!req.dbConfig) {
    return res.status(400).json({
      error: 'Database configuration required',
      message: 'Please configure your database connection in the settings page'
    })
  }
  next()
}
