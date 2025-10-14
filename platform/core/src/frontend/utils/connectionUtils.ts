/**
 * Connection Utilities for Named Database Connections
 * Feature: 014-save-configuration-connection
 */

import { NamedConnection } from '../types'

const NAMED_CONNECTIONS_KEY = 'namedDatabaseConnections'
const LEGACY_CONNECTIONS_KEY = 'databaseConnectionHistory'

/**
 * T002: Mask credentials in connection strings for display
 * Hides username:password while preserving protocol, host, port, database
 */
export function maskConnectionString(connStr: string): string {
  // Match and replace credentials section for various database protocols
  return connStr.replace(
    /(postgresql|postgres|mysql|mongodb|mongodb\+srv):\/\/([^:]+):([^@]+)@/,
    '$1://***:***@'
  )
}

/**
 * T003: Load named connections from localStorage
 * Auto-migrates legacy format if detected
 */
export function loadNamedConnections(): NamedConnection[] {
  try {
    // Check for legacy format first
    const legacyData = localStorage.getItem(LEGACY_CONNECTIONS_KEY)
    if (legacyData) {
      try {
        const legacyConnections: string[] = JSON.parse(legacyData)
        if (Array.isArray(legacyConnections) && legacyConnections.length > 0) {
          // Migrate if legacy data exists
          return migrateLegacyConnections(legacyConnections)
        }
      } catch (e) {
        console.warn('Failed to parse legacy connections:', e)
      }
    }

    // Load new format
    const stored = localStorage.getItem(NAMED_CONNECTIONS_KEY)
    if (!stored) return []

    const connections: NamedConnection[] = JSON.parse(stored)
    return Array.isArray(connections) ? connections : []
  } catch (e) {
    console.error('Failed to load named connections:', e)
    return []
  }
}

/**
 * T004: Migrate legacy connection strings to named format
 * Generates auto-names: "old connection string 1", "old connection string 2", etc.
 */
export function migrateLegacyConnections(legacyConnections: string[]): NamedConnection[] {
  const migrated: NamedConnection[] = legacyConnections.map((connStr, index) => ({
    name: `old connection string ${index + 1}`,
    connectionString: connStr,
    createdAt: new Date().toISOString()
  }))

  // Save to new format
  try {
    localStorage.setItem(NAMED_CONNECTIONS_KEY, JSON.stringify(migrated))
    // Delete legacy key
    localStorage.removeItem(LEGACY_CONNECTIONS_KEY)
    console.log(`Migrated ${migrated.length} legacy connections to named format`)
  } catch (e) {
    console.error('Failed to save migrated connections:', e)
  }

  return migrated
}

/**
 * T005: Save a new named connection
 * Validates uniqueness and creates new entry with timestamp
 */
export function saveNamedConnection(
  name: string,
  connectionString: string,
  existing: NamedConnection[]
): NamedConnection[] {
  const trimmedName = name.trim()
  const trimmedConnStr = connectionString.trim()

  if (!trimmedConnStr) {
    throw new Error('Connection string cannot be empty')
  }

  // Use masked string as name if no name provided
  const finalName = trimmedName || maskConnectionString(trimmedConnStr)

  // Validate uniqueness
  if (existing.some(c => c.name === finalName)) {
    throw new Error('A connection with this name already exists. Please choose a different name.')
  }

  const newConnection: NamedConnection = {
    name: finalName,
    connectionString: trimmedConnStr,
    createdAt: new Date().toISOString()
  }

  const updated = [...existing, newConnection]

  try {
    localStorage.setItem(NAMED_CONNECTIONS_KEY, JSON.stringify(updated))
  } catch (e) {
    if (e instanceof Error && e.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete some saved connections.')
    }
    throw new Error('Failed to save connection. Please try again.')
  }

  return updated
}

/**
 * T006: Delete a named connection
 * Removes connection by name and updates localStorage
 */
export function deleteNamedConnection(
  name: string,
  existing: NamedConnection[]
): NamedConnection[] {
  const updated = existing.filter(c => c.name !== name)

  try {
    localStorage.setItem(NAMED_CONNECTIONS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to delete connection:', e)
    throw new Error('Failed to delete connection. Please try again.')
  }

  return updated
}

/**
 * T007: Rename a named connection
 * Validates new name uniqueness and updates connection
 */
export function renameNamedConnection(
  oldName: string,
  newName: string,
  existing: NamedConnection[]
): NamedConnection[] {
  const trimmedNewName = newName.trim()

  if (!trimmedNewName) {
    throw new Error('Connection name cannot be empty')
  }

  // Validate uniqueness (excluding the connection being renamed)
  if (existing.filter(c => c.name !== oldName).some(c => c.name === trimmedNewName)) {
    throw new Error('A connection with this name already exists. Please choose a different name.')
  }

  const updated = existing.map(c =>
    c.name === oldName ? { ...c, name: trimmedNewName } : c
  )

  try {
    localStorage.setItem(NAMED_CONNECTIONS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to rename connection:', e)
    throw new Error('Failed to rename connection. Please try again.')
  }

  return updated
}
