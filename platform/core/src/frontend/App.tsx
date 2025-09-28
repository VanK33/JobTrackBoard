import React, { useState, useEffect } from 'react'
import ModuleStore from './components/ModuleStore'
import Workspace from './components/Workspace'
import MinimalistWorkspace from './components/MinimalistWorkspace'
import JobDashboard from './components/JobDashboard'
import DatabaseSettings from './components/DatabaseSettings'
import Header from './components/Header'
import { ModuleInfo, InstalledModule } from './types'

function App() {
  const [view, setView] = useState<'store' | 'workspace' | 'minimalist' | 'dashboard' | 'settings'>('dashboard')
  const [availableModules, setAvailableModules] = useState<ModuleInfo[]>([])
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🚀 App component mounted, fetching modules...')
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      console.log('📡 Fetching modules from backend...')

      // Check if backend is available first
      const healthResponse = await fetch('http://localhost:3000/health')
      if (!healthResponse.ok) {
        throw new Error('Backend not available')
      }

      // 获取可用模块
      const modulesResponse = await fetch('http://localhost:3000/api/modules')
      console.log('📦 Modules response:', modulesResponse.status)

      if (!modulesResponse.ok) {
        throw new Error(`HTTP ${modulesResponse.status}: ${modulesResponse.statusText}`)
      }

      const modules = await modulesResponse.json()
      console.log('📦 Modules data:', modules)

      // 获取平台信息（包含已安装模块）
      const platformResponse = await fetch('http://localhost:3000/api/platform/info')
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
      await fetch(`http://localhost:3000/api/modules/${moduleId}/enable`, { method: 'POST' })
      await fetchModules() // 刷新状态
    } catch (error) {
      console.error('Failed to install module:', error)
    }
  }

  const handleUninstallModule = async (moduleId: string) => {
    try {
      await fetch(`http://localhost:3000/api/modules/${moduleId}/disable`, { method: 'POST' })
      await fetchModules() // 刷新状态
    } catch (error) {
      console.error('Failed to uninstall module:', error)
    }
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
    </div>
  )
}

export default App