import React, { useState, useEffect } from 'react'
import ModuleStore from './components/ModuleStore'
import Workspace from './components/Workspace'
import MinimalistWorkspace from './components/MinimalistWorkspace'
import JobDashboard from './components/JobDashboard'
import Header from './components/Header'
import { ModuleInfo, InstalledModule } from './types'

function App() {
  const [view, setView] = useState<'store' | 'workspace' | 'minimalist' | 'dashboard'>('dashboard')
  const [availableModules, setAvailableModules] = useState<ModuleInfo[]>([])
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      // 获取可用模块
      const modulesResponse = await fetch('/api/modules')
      const modules = await modulesResponse.json()
      
      // 获取平台信息（包含已安装模块）
      const platformResponse = await fetch('/api/platform/info')
      const platformInfo = await platformResponse.json()
      
      setAvailableModules(modules)
      setInstalledModules(platformInfo.enabledModules || [])
    } catch (error) {
      console.error('Failed to fetch modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInstallModule = async (moduleId: string) => {
    try {
      await fetch(`/api/modules/${moduleId}/enable`, { method: 'POST' })
      await fetchModules() // 刷新状态
    } catch (error) {
      console.error('Failed to install module:', error)
    }
  }

  const handleUninstallModule = async (moduleId: string) => {
    try {
      await fetch(`/api/modules/${moduleId}/disable`, { method: 'POST' })
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

  // Show the new dashboard design
  if (view === 'dashboard') {
    return <JobDashboard />
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