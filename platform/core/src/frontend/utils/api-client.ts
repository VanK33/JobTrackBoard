/**
 * API Client with database config injection
 * Automatically adds database configuration to request headers
 */

import { API_BASE_URL } from '../config/api'
import { DatabaseConfig } from '../types'

const DB_CONFIG_HEADER = 'X-Database-Config'
const DB_CONFIG_STORAGE_KEY = 'databaseConfig'

/**
 * Get database config from localStorage
 */
export function getStoredDatabaseConfig(): DatabaseConfig | null {
  try {
    const stored = localStorage.getItem(DB_CONFIG_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load database config from localStorage:', error)
  }
  return null
}

/**
 * Store database config to localStorage
 */
export function storeDatabaseConfig(config: DatabaseConfig): void {
  try {
    localStorage.setItem(DB_CONFIG_STORAGE_KEY, JSON.stringify(config))
  } catch (error) {
    console.error('Failed to store database config to localStorage:', error)
  }
}

/**
 * Clear database config from localStorage
 */
export function clearDatabaseConfig(): void {
  try {
    localStorage.removeItem(DB_CONFIG_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear database config from localStorage:', error)
  }
}

/**
 * Enhanced fetch with automatic database config injection
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`

  // Get database config from localStorage
  const dbConfig = getStoredDatabaseConfig()

  // Prepare headers
  const headers = new Headers(options.headers || {})

  // Add database config to headers if available
  if (dbConfig) {
    const configString = JSON.stringify(dbConfig)
    const encoded = btoa(configString) // Base64 encode
    headers.set(DB_CONFIG_HEADER, encoded)
  }

  // Merge options with headers
  const fetchOptions: RequestInit = {
    ...options,
    headers
  }

  return fetch(url, fetchOptions)
}

/**
 * API client with common methods
 */
export const apiClient = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    return apiFetch(endpoint, { ...options, method: 'GET' })
  },

  post: async (endpoint: string, data?: any, options: RequestInit = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  },

  put: async (endpoint: string, data?: any, options: RequestInit = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  },

  patch: async (endpoint: string, data?: any, options: RequestInit = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  },

  delete: async (endpoint: string, options: RequestInit = {}) => {
    return apiFetch(endpoint, { ...options, method: 'DELETE' })
  }
}
