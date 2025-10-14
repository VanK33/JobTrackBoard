import React, { useState, useEffect } from 'react'
import { DatabaseConfig, DatabaseProvider, DatabaseStatus, NamedConnection } from '../types'
import { apiClient, getStoredDatabaseConfig, storeDatabaseConfig } from '../utils/api-client'
import TutorialModal from '../components/TutorialModal'
import {
  loadNamedConnections,
  maskConnectionString,
  saveNamedConnection,
  deleteNamedConnection,
  renameNamedConnection
} from '../utils/connectionUtils'

interface DatabaseSettingsProps {
  onNavigateBack?: () => void
}

const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({ onNavigateBack }) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    type: 'postgresql',
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: true,
    connectionString: ''
  })
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    lastChecked: undefined,
    error: undefined,
    tablesInitialized: false
  })
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [useConnectionString, setUseConnectionString] = useState(true)
  const [savedConnectionString, setSavedConnectionString] = useState('')
  const [connectionStringHistory, setConnectionStringHistory] = useState<string[]>([])
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [showAdvancedFields, setShowAdvancedFields] = useState(false)

  // T008: Named connection state
  const [connectionName, setConnectionName] = useState<string>('')
  const [savedConnections, setSavedConnections] = useState<NamedConnection[]>([])
  const [saveError, setSaveError] = useState<string>('')
  const [editingConnection, setEditingConnection] = useState<NamedConnection | null>(null)
  const [newName, setNewName] = useState<string>('')

  // UI improvements: edit modal & drag-drop
  const [showEditModal, setShowEditModal] = useState(false)
  const [editModalData, setEditModalData] = useState<{ name: string; connectionString: string } | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Utility function to parse connection string and detect database type
  const parseConnectionString = (connectionString: string): DatabaseConfig['type'] | null => {
    if (!connectionString) return null

    const lowerCase = connectionString.toLowerCase()
    if (lowerCase.startsWith('postgresql://') || lowerCase.startsWith('postgres://')) {
      return 'postgresql'
    }
    if (lowerCase.startsWith('mysql://')) {
      return 'mysql'
    }
    if (lowerCase.startsWith('mongodb://') || lowerCase.startsWith('mongodb+srv://')) {
      return 'mongodb'
    }
    return null
  }

  // Recommended database providers
  const providers: DatabaseProvider[] = [
    {
      id: 'supabase',
      name: 'Supabase',
      description: 'Easiest PostgreSQL setup, free to start',
      freeLimit: '500MB storage, 2 projects',
      setupComplexity: 'Easy',
      recommendedFor: ['Personal users', 'Beginners', 'Quick start'],
      logo: 'SUP',
      signupUrl: 'https://supabase.com/dashboard',
      docsUrl: 'https://supabase.com/docs/guides/database/connecting-to-postgres',
      type: 'postgresql'
    },
    {
      id: 'neon',
      name: 'Neon',
      description: 'Serverless PostgreSQL, pay-as-you-go',
      freeLimit: '3GB storage, unlimited projects',
      setupComplexity: 'Easy',
      recommendedFor: ['Developers', 'Scalability needs'],
      logo: 'NEON',
      signupUrl: 'https://neon.tech',
      docsUrl: 'https://neon.tech/docs/connect/connect-from-any-app',
      type: 'postgresql'
    },
    {
      id: 'railway',
      name: 'Railway PostgreSQL',
      description: 'Simple cloud database deployment',
      freeLimit: '$5/month free tier',
      setupComplexity: 'Easy',
      recommendedFor: ['Developers', 'Project hosting'],
      logo: 'RAIL',
      signupUrl: 'https://railway.app',
      docsUrl: 'https://docs.railway.app/databases/postgresql',
      type: 'postgresql'
    }
  ]

  // Load saved config and named connections from localStorage
  useEffect(() => {
    const loadConfig = async () => {
      // T003: Load named connections (auto-migrates legacy format)
      const connections = loadNamedConnections()
      setSavedConnections(connections)

      // Load config from localStorage
      const savedConfig = getStoredDatabaseConfig()
      if (savedConfig) {
        setConfig(savedConfig)
        if (savedConfig.connectionString) {
          setUseConnectionString(true)
          setSavedConnectionString(savedConfig.connectionString)
        }
      }
    }

    loadConfig()
  }, [])

  const handleConfigChange = (field: keyof DatabaseConfig, value: any) => {
    setConfig(prev => {
      const newConfig = {
        ...prev,
        [field]: value
      }

      // T009: Auto-detect database type from connection string (keep this logic)
      // BUT remove auto-save behavior (removed lines 141-148)
      if (field === 'connectionString' && useConnectionString) {
        const detectedType = parseConnectionString(value)
        if (detectedType) {
          newConfig.type = detectedType
        }
      }

      return newConfig
    })
  }

  const saveConfig = async () => {
    try {
      // T013: Clear any previous error
      setSaveError('')

      // Clean config: when using connection string, clear individual fields
      const cleanConfig = config.connectionString
        ? {
            type: config.type,
            connectionString: config.connectionString,
            ssl: config.ssl,
            storage: config.storage
          }
        : config

      // T013: Save named connection if using connection string
      if (config.connectionString) {
        try {
          const updated = saveNamedConnection(
            connectionName,
            config.connectionString,
            savedConnections
          )
          setSavedConnections(updated)
          // Clear connection name input after successful save
          setConnectionName('')
        } catch (error) {
          // Display validation error
          setSaveError(error instanceof Error ? error.message : 'Failed to save connection')
          return // Don't save config if connection saving failed
        }
      }

      // Save to localStorage only - no server persistence
      storeDatabaseConfig(cleanConfig)
      alert('Database configuration saved to browser! All API requests will use this database.')
    } catch (error) {
      setSaveError(`Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleOpenTutorial = () => {
    setShowTutorialModal(true)
  }

  const handleCloseTutorial = () => {
    setShowTutorialModal(false)
  }

  const handleToggleAdvancedFields = () => {
    setShowAdvancedFields(prev => !prev)
  }

  // T011: Delete connection handler
  const handleDeleteConnection = (name: string) => {
    try {
      const updated = deleteNamedConnection(name, savedConnections)
      setSavedConnections(updated)
    } catch (error) {
      alert(`Failed to delete connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // T012: Rename connection handler
  const handleRenameConnection = (oldName: string, newNameValue: string) => {
    try {
      const updated = renameNamedConnection(oldName, newNameValue, savedConnections)
      setSavedConnections(updated)
      setEditingConnection(null)
      setNewName('')
    } catch (error) {
      alert(`Failed to rename connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Edit modal handlers
  const handleOpenEditModal = (conn: NamedConnection) => {
    setEditModalData({ name: conn.name, connectionString: conn.connectionString })
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditModalData(null)
  }

  const handleSaveEdit = () => {
    if (!editModalData) return

    try {
      // Find the original connection
      const originalConn = savedConnections.find(c => c.connectionString === editModalData.connectionString)
      if (!originalConn) return

      // Update both name and connection string
      const updated = savedConnections.map(c => {
        if (c === originalConn) {
          return { ...c, name: editModalData.name.trim() || maskConnectionString(editModalData.connectionString), connectionString: editModalData.connectionString }
        }
        return c
      })

      // Save to localStorage
      try {
        localStorage.setItem('namedDatabaseConnections', JSON.stringify(updated))
        setSavedConnections(updated)
        handleCloseEditModal()
      } catch (error) {
        alert('Failed to save changes')
      }
    } catch (error) {
      alert(`Failed to update connection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const updated = [...savedConnections]
    const draggedItem = updated[draggedIndex]
    updated.splice(draggedIndex, 1)
    updated.splice(index, 0, draggedItem)

    setSavedConnections(updated)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      // Save reordered connections to localStorage
      try {
        localStorage.setItem('namedDatabaseConnections', JSON.stringify(savedConnections))
      } catch (error) {
        console.error('Failed to save reordered connections:', error)
      }
    }
    setDraggedIndex(null)
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setStatus(prev => ({ ...prev, error: undefined }))

    try {
      // Clean config: when using connection string, clear individual fields
      const cleanConfig = config.connectionString
        ? {
            type: config.type,
            connectionString: config.connectionString,
            ssl: config.ssl,
            storage: config.storage
          }
        : config

      // Temporarily store clean config to localStorage for testing
      storeDatabaseConfig(cleanConfig)

      const response = await apiClient.post('/api/database/test', cleanConfig)
      const result = await response.json()

      if (response.ok) {
        setStatus({
          connected: true,
          lastChecked: new Date().toISOString(),
          tablesInitialized: result.tablesInitialized
        })
        // Config already saved above
        alert('Connection successful!')
      } else {
        setStatus({
          connected: false,
          lastChecked: new Date().toISOString(),
          error: result.error || 'Connection failed'
        })
      }
    } catch (error) {
      setStatus({
        connected: false,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const initializeDatabase = async () => {
    try {
      // Use clean config
      const cleanConfig = config.connectionString
        ? {
            type: config.type,
            connectionString: config.connectionString,
            ssl: config.ssl,
            storage: config.storage
          }
        : config

      const response = await apiClient.post('/api/database/initialize', cleanConfig)
      const result = await response.json()

      if (response.ok) {
        setStatus(prev => ({
          ...prev,
          tablesInitialized: true
        }))
        alert('Database initialized successfully!')
      } else {
        setStatus(prev => ({
          ...prev,
          error: result.error || 'Database initialization failed'
        }))
      }
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Network error'
      }))
    }
  }


  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '8px'
          }}>
            {onNavigateBack && (
              <button
                onClick={onNavigateBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#6b7280',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                  e.currentTarget.style.color = '#374151'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6b7280'
                }}
                title="Back to Dashboard"
              >
                ←
              </button>
            )}
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: '700',
              color: '#111827'
            }}>
              {getStoredDatabaseConfig() ? 'Database Settings' : 'Database Initialization'}
            </h1>
          </div>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Connect your database to persist job tracking data
          </p>
        </div>

        {/* Status Card */}
        {status.lastChecked && (
          <div style={{
            backgroundColor: status.connected ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${status.connected ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: status.connected ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: 'white',
                fontWeight: '600'
              }}>
                {status.connected ? '✓' : '✗'}
              </div>
              <span style={{
                fontWeight: '600',
                color: status.connected ? '#065f46' : '#991b1b'
              }}>
                {status.connected ? 'Database connected successfully' : 'Database connection failed'}
              </span>
            </div>
            {status.error && (
              <p style={{
                margin: '4px 0 0 28px',
                fontSize: '14px',
                color: '#991b1b'
              }}>
                {status.error}
              </p>
            )}
            {status.connected && !status.tablesInitialized && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#fef3c7',
                borderRadius: '8px'
              }}>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  Database tables not yet initialized
                </p>
                <button
                  onClick={initializeDatabase}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Initialize Database
                </button>
              </div>
            )}

            {/* Migration Section - Show after successful connection and initialization */}
            {status.connected && status.tablesInitialized && (
              <div style={{
                backgroundColor: '#f0f9ff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e0f2fe',
                marginTop: '16px'
              }}>
                <div style={{ color: '#0369a1', fontWeight: '500', marginBottom: '8px' }}>
                  ✅ Database Ready
                </div>
                <div style={{ color: '#075985', fontSize: '14px' }}>
                  Your database is connected and initialized. All tables are ready for use.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recommended Providers */}
        {!status.connected && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827'
            }}>
              Recommended Database Providers (PostgreSQL Only)
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              color: '#6b7280',
              backgroundColor: '#f0f9ff',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #e0f2fe'
            }}>
              This project is designed for Supabase by default. Should work with other PostgreSQL
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {providers.map(provider => (
                <div
                  key={provider.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#6b7280',
                      padding: '4px 6px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {provider.logo}
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827'
                    }}>
                      {provider.name}
                    </h3>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      backgroundColor: provider.setupComplexity === 'Easy' ? '#dcfce7' : '#fef3c7',
                      color: provider.setupComplexity === 'Easy' ? '#166534' : '#92400e',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}>
                      {provider.setupComplexity}
                    </span>
                  </div>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {provider.description}
                  </p>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginBottom: '8px'
                  }}>
                    Free tier: {provider.freeLimit}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <a
                        href={provider.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '12px',
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                      >
                        Sign up
                      </a>
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          fontSize: '12px',
                          color: '#3b82f6',
                          textDecoration: 'none'
                        }}
                      >
                        Docs
                      </a>
                    </div>
                    {provider.id === 'supabase' && (
                      <button
                        onClick={handleOpenTutorial}
                        style={{
                          fontSize: '12px',
                          color: '#3b82f6',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          padding: 0
                        }}
                      >
                        Tutorial
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Database Configuration Form */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827'
          }}>
            Database Connection Configuration
          </h2>

          {/* Advanced Options Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleToggleAdvancedFields}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: '4px 0'
              }}
            >
              {showAdvancedFields ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>

          {/* Connection String Input (shown when Advanced is hidden) */}
          {!showAdvancedFields && (
            <div style={{ marginBottom: '16px' }}>
              {/* T008: Connection Name Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Connection Name (optional)
                </label>
                <input
                  type="text"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="My Production Database"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  Give this connection a memorable name (if empty, will display masked connection string)
                </p>
              </div>

              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Database Connection String
              </label>
              <input
                type="password"
                value={config.connectionString || ''}
                onChange={(e) => handleConfigChange('connectionString', e.target.value)}
                placeholder="postgresql://username:password@host:port/database"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
              <p style={{
                margin: '4px 0 0 0',
                fontSize: '12px',
                color: '#6b7280'
              }}>
                Copy the complete connection string from your database provider
              </p>

              {/* Saved Connections - Card Grid */}
              {savedConnections.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Saved Connections
                  </label>
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '10px',
                      maxWidth: '600px'
                    }}>
                    {savedConnections.map((conn, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          handleConfigChange('connectionString', conn.connectionString)
                          setConnectionName(conn.name)
                        }}
                        style={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          cursor: 'move',
                          transition: 'all 0.2s ease',
                          boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
                          opacity: draggedIndex === index ? 0.5 : 1,
                          minHeight: '44px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => {
                          if (draggedIndex !== index) {
                            e.currentTarget.style.borderColor = '#3b82f6'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (draggedIndex !== index) {
                            e.currentTarget.style.borderColor = '#e5e7eb'
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          marginRight: '8px'
                        }}>
                          {conn.name}
                        </div>
                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditModal(conn)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f3f4f6'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                            title="Edit connection"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Delete connection "${conn.name}"?`)) {
                                handleDeleteConnection(conn.name)
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                            title="Delete connection"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Individual Fields (shown when Advanced toggled) */}
          {showAdvancedFields && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Database Type
                </label>
                <select
                  value={config.type}
                  onChange={(e) => handleConfigChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="postgresql">PostgreSQL</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Host
                </label>
                <input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleConfigChange('host', e.target.value)}
                  placeholder="localhost"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Port
                </label>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Database Name
                </label>
                <input
                  type="text"
                  value={config.database}
                  onChange={(e) => handleConfigChange('database', e.target.value)}
                  placeholder="jobtracker"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Username
                </label>
                <input
                  type="text"
                  value={config.username}
                  onChange={(e) => handleConfigChange('username', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '4px'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          )}

          {/* SSL Option */}
          <div style={{ margin: '16px 0' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={config.ssl}
                onChange={(e) => handleConfigChange('ssl', e.target.checked)}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Use SSL connection (recommended)
              </span>
            </label>
          </div>

          {/* T013: Error Display */}
          {saveError && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              {saveError}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '24px'
          }}>
            <button
              onClick={testConnection}
              disabled={isTestingConnection || (!config.connectionString && !config.host)}
              style={{
                padding: '12px 24px',
                backgroundColor: isTestingConnection ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isTestingConnection ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              {isTestingConnection ? 'Connecting...' : 'Connect Database'}
            </button>

            <button
              onClick={saveConfig}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      <TutorialModal
        isOpen={showTutorialModal}
        onClose={handleCloseTutorial}
      />

      {/* Edit Connection Modal */}
      {showEditModal && editModalData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={handleCloseEditModal}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Edit Connection
              </h3>
              <button
                onClick={handleCloseEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Connection Name
              </label>
              <input
                type="text"
                value={editModalData.name}
                onChange={(e) => setEditModalData({ ...editModalData, name: e.target.value })}
                placeholder="My Database"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Connection String
              </label>
              <input
                type="password"
                value={editModalData.connectionString}
                onChange={(e) => setEditModalData({ ...editModalData, connectionString: e.target.value })}
                placeholder="postgresql://username:password@host:port/database"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCloseEditModal}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                  e.currentTarget.style.borderColor = '#9ca3af'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white'
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatabaseSettings