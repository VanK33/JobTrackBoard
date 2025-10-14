import React, { useState, useEffect } from 'react'
import ModuleStore from './pages/ModuleStore'
import Workspace from './pages/Workspace'
import MinimalistWorkspace from './pages/MinimalistWorkspace'
import JobDashboard from './pages/JobDashboard'
import { API_BASE_URL } from './config/api'
import DatabaseSettings from './pages/DatabaseSettings'
import Header from './components/Header'
import { ModuleInfo, InstalledModule } from './types'
import { getStoredDatabaseConfig } from './utils/api-client'
import TutorialModal from './components/TutorialModal'
import { useTutorialState } from './hooks/useTutorialState'

function App() {
  const [view, setView] = useState<'store' | 'workspace' | 'minimalist' | 'dashboard' | 'settings'>('dashboard')
  const [availableModules, setAvailableModules] = useState<ModuleInfo[]>([])
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([])
  const [loading, setLoading] = useState(true)
  const [needsDatabaseSetup, setNeedsDatabaseSetup] = useState(false)

  // Tutorial state management (T004: auto-trigger logic)
  const { hasSeen, markAsSeen } = useTutorialState()
  const [showTutorial, setShowTutorial] = useState(false)

  // T004: Auto-trigger tutorial on first login
  useEffect(() => {
    if (!hasSeen && !loading && !needsDatabaseSetup) {
      setShowTutorial(true)
    }
  }, [hasSeen, loading, needsDatabaseSetup])

  useEffect(() => {
    console.log('🚀 App component mounted, checking database config...')

    // Check if database is configured
    const dbConfig = getStoredDatabaseConfig()
    if (!dbConfig) {
      console.log('⚠️ No database configuration found, showing setup page')
      setNeedsDatabaseSetup(true)
      setLoading(false)
      return
    }

    console.log('✅ Database config found, fetching modules...')
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      console.log('📡 Fetching modules from backend...')

      // Check if backend is available first
      const healthResponse = await fetch(`${API_BASE_URL}/health`)
      if (!healthResponse.ok) {
        throw new Error('Backend not available')
      }

      // 获取可用模块
      const modulesResponse = await fetch(`${API_BASE_URL}/api/modules`)
      console.log('📦 Modules response:', modulesResponse.status)

      if (!modulesResponse.ok) {
        throw new Error(`HTTP ${modulesResponse.status}: ${modulesResponse.statusText}`)
      }

      const modules = await modulesResponse.json()
      console.log('📦 Modules data:', modules)

      // 获取平台信息（包含已安装模块）
      const platformResponse = await fetch(`${API_BASE_URL}/api/platform/info`)
      if (!platformResponse.ok) {
        throw new Error(`HTTP ${platformResponse.status}: ${platformResponse.statusText}`)
      }

      const platformInfo = await platformResponse.json()

      setAvailableModules(modules)
      setInstalledModules(platformInfo.enabledModules || [])
    } catch (error) {
      console.error('Failed to fetch modules:', error)

      // Set fallback data when backend is unavailable
      setAvailableModules([])
      setInstalledModules([{
        id: 'job-tracker-basic',
        name: 'job-tracker-basic',
        displayName: 'Job Tracker (Offline Mode)',
        version: '1.0.0',
        enabled: true,
        status: 'active'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleInstallModule = async (moduleId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/modules/${moduleId}/enable`, { method: 'POST' })
      await fetchModules() // 刷新状态
    } catch (error) {
      console.error('Failed to install module:', error)
    }
  }

  const handleUninstallModule = async (moduleId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/modules/${moduleId}/disable`, { method: 'POST' })
      await fetchModules() // 刷新状态
    } catch (error) {
      console.error('Failed to uninstall module:', error)
    }
  }

  // T004: Tutorial close handler
  const handleTutorialClose = () => {
    markAsSeen() // FR-012b: Prevent re-trigger
    setShowTutorial(false)
  }

  // Show database setup page if not configured
  if (needsDatabaseSetup) {
    return (
      <DatabaseSettings
        onNavigateBack={() => {
          // After setup, check config and reload
          const dbConfig = getStoredDatabaseConfig()
          if (dbConfig) {
            setNeedsDatabaseSetup(false)
            setLoading(true)
            fetchModules()
          }
        }}
      />
    )
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontSize: '18px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        加载中...
      </div>
    )
  }

  // Show the new dashboard design - bypass loading for now
  if (view === 'dashboard' || loading) {
    return <JobDashboard onNavigateToSettings={() => setView('settings')} />
  }

  // Force dashboard view for debugging
  console.log('Current view:', view)
  if (view === 'settings') {
    console.log('In settings view, showing DatabaseSettings')
  }

  // Database settings
  if (view === 'settings') {
    return <DatabaseSettings onNavigateBack={() => setView('dashboard')} />
  }

  // For now, directly show the minimalist design
  // You can add a toggle later if needed
  if (view === 'minimalist') {
    return <MinimalistWorkspace />
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header
        currentView={view}
        onViewChange={setView}
        installedCount={installedModules.length}
      />

      {view === 'store' ? (
        <ModuleStore
          modules={availableModules}
          installedModules={installedModules}
          onInstall={handleInstallModule}
          onUninstall={handleUninstallModule}
        />
      ) : (
        <Workspace
          installedModules={installedModules}
          onUninstall={handleUninstallModule}
        />
      )}

      {/* T004: Tutorial modal with auto-trigger */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={handleTutorialClose}
      />

      {/* T005: Manual trigger button (bottom-right corner) */}
      <button
        onClick={() => setShowTutorial(true)}
        aria-label="Open tutorial"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
      >
        Tutorial
      </button>
    </div>
  )
}

export default App