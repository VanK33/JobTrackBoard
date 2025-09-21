import React, { useState, useEffect } from 'react'
import { DatabaseConfig, DatabaseProvider, DatabaseStatus } from '../types'
import { DataMigrationService } from '../utils/data-migration'

interface DatabaseSettingsProps {
  onNavigateBack?: () => void
}

const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({ onNavigateBack }) => {
  const [selectedProvider, setSelectedProvider] = useState<DatabaseProvider | null>(null)
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
  const [useConnectionString, setUseConnectionString] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<{
    isRunning: boolean;
    completed: boolean;
    found: number;
    imported: number;
    errors: string[];
    summary: string;
  }>({
    isRunning: false,
    completed: false,
    found: 0,
    imported: 0,
    errors: [],
    summary: ''
  })

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
    },
    {
      id: 'mongodb-atlas',
      name: 'MongoDB Atlas',
      description: 'Document database for flexible data structures',
      freeLimit: '512MB storage',
      setupComplexity: 'Medium',
      recommendedFor: ['NoSQL preference', 'Document data'],
      logo: 'MONGO',
      signupUrl: 'https://cloud.mongodb.com',
      docsUrl: 'https://docs.atlas.mongodb.com/getting-started/',
      type: 'mongodb'
    }
  ]

  // Load saved config
  useEffect(() => {
    const savedConfig = localStorage.getItem('databaseConfig')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
        if (parsed.connectionString) {
          setUseConnectionString(true)
        }
      } catch (error) {
        console.error('Failed to load database config:', error)
      }
    }
  }, [])

  const handleConfigChange = (field: keyof DatabaseConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveConfig = () => {
    localStorage.setItem('databaseConfig', JSON.stringify(config))
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    setStatus(prev => ({ ...prev, error: undefined }))

    try {
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (response.ok) {
        setStatus({
          connected: true,
          lastChecked: new Date().toISOString(),
          tablesInitialized: result.tablesInitialized
        })
        saveConfig()
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
      const response = await fetch('/api/database/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (response.ok) {
        setStatus(prev => ({
          ...prev,
          tablesInitialized: true
        }))
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

  const selectProvider = (provider: DatabaseProvider) => {
    setSelectedProvider(provider)
    setConfig(prev => ({
      ...prev,
      type: provider.type,
      port: provider.type === 'postgresql' ? 5432 : provider.type === 'mysql' ? 3306 : 27017
    }))
  }

  const runDataMigration = async () => {
    setMigrationStatus(prev => ({ ...prev, isRunning: true, errors: [] }))

    try {
      const result = await DataMigrationService.migrateAll()

      setMigrationStatus({
        isRunning: false,
        completed: true,
        found: result.found,
        imported: result.imported,
        errors: result.errors,
        summary: result.summary
      })

      if (result.success && result.imported > 0) {
        // Optionally clear localStorage after successful migration
        DataMigrationService.clearJobDataFromLocalStorage()
      }

    } catch (error) {
      setMigrationStatus({
        isRunning: false,
        completed: true,
        found: 0,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Migration failed'],
        summary: 'Migration failed due to an error'
      })
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
              Database Settings
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
                <div style={{ color: '#075985', fontSize: '14px', marginBottom: '12px' }}>
                  Your database is connected and initialized. All tables are ready for use.
                </div>

                {/* Data Migration Section */}
                <div style={{
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1'
                }}>
                  <div style={{ color: '#1e293b', fontWeight: '500', marginBottom: '8px' }}>
                    📥 Data Migration
                  </div>
                  <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '12px' }}>
                    Import your existing job data from localStorage to the database.
                  </div>

                  {!migrationStatus.completed && (
                    <button
                      onClick={runDataMigration}
                      disabled={migrationStatus.isRunning}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: migrationStatus.isRunning ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: migrationStatus.isRunning ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {migrationStatus.isRunning ? 'Migrating...' : 'Migrate Data from Browser'}
                    </button>
                  )}

                  {migrationStatus.completed && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        color: migrationStatus.errors.length > 0 ? '#dc2626' : '#059669',
                        fontSize: '13px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {migrationStatus.summary}
                      </div>
                      {migrationStatus.found > 0 && (
                        <div style={{ color: '#64748b', fontSize: '12px' }}>
                          Found: {migrationStatus.found} • Imported: {migrationStatus.imported}
                          {migrationStatus.errors.length > 0 && ` • Errors: ${migrationStatus.errors.length}`}
                        </div>
                      )}
                      {migrationStatus.errors.length > 0 && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          backgroundColor: '#fef2f2',
                          borderRadius: '4px',
                          border: '1px solid #fecaca'
                        }}>
                          <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '500' }}>
                            Errors:
                          </div>
                          {migrationStatus.errors.slice(0, 3).map((error, index) => (
                            <div key={index} style={{ color: '#dc2626', fontSize: '11px', marginTop: '2px' }}>
                              • {error}
                            </div>
                          ))}
                          {migrationStatus.errors.length > 3 && (
                            <div style={{ color: '#dc2626', fontSize: '11px', marginTop: '2px' }}>
                              ... and {migrationStatus.errors.length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
              Recommended Database Providers
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {providers.map(provider => (
                <div
                  key={provider.id}
                  onClick={() => selectProvider(provider)}
                  style={{
                    border: selectedProvider?.id === provider.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedProvider?.id === provider.id ? '#eff6ff' : 'white'
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

          {/* Connection String Toggle */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={useConnectionString}
                onChange={(e) => setUseConnectionString(e.target.checked)}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Use connection string (recommended)
              </span>
            </label>
          </div>

          {useConnectionString ? (
            /* Connection String Input */
            <div style={{ marginBottom: '16px' }}>
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
            </div>
          ) : (
            /* Individual Fields */
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
                  <option value="mysql">MySQL</option>
                  <option value="mongodb">MongoDB</option>
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
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
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
    </div>
  )
}

export default DatabaseSettings