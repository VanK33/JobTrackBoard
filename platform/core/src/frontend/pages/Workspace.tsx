import React, { useState } from 'react'
import { InstalledModule } from '../types'
import JobTrackerModule from '../components/modules/JobTrackerModule'

interface WorkspaceProps {
  installedModules: InstalledModule[]
  onUninstall: (moduleId: string) => void
}

const Workspace: React.FC<WorkspaceProps> = ({ installedModules, onUninstall }) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(
    installedModules.length > 0 ? installedModules[0].id : null
  )
  const [isDropZoneActive, setIsDropZoneActive] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDropZoneActive(false)
    
    const moduleId = e.dataTransfer.getData('text/plain')
    if (moduleId) {
      try {
        await fetch(`/api/modules/${moduleId}/enable`, { method: 'POST' })
        // 这里应该刷新父组件的状态，但为了简化，我们就先这样
        window.location.reload()
      } catch (error) {
        console.error('Failed to install module:', error)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDropZoneActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDropZoneActive(false)
  }

  const renderModuleComponent = (moduleId: string) => {
    switch (moduleId) {
      case 'job-tracker-basic':
        return <JobTrackerModule />
      case 'jd-resume-compare':
        return (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>🤖 JD-简历对比分析</h3>
            <p>AI驱动的职位描述与简历匹配度分析功能即将推出！</p>
          </div>
        )
      case 'ocr-scanner':
        return (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>📷 OCR智能扫描</h3>
            <p>图片文字识别功能即将推出！</p>
          </div>
        )
      case 'linkedin-sync':
        return (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>🔗 LinkedIn同步</h3>
            <p>LinkedIn数据同步功能即将推出！</p>
          </div>
        )
      default:
        return (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <h3>未知模块</h3>
            <p>该模块的前端组件尚未实现</p>
          </div>
        )
    }
  }

  if (installedModules.length === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div 
          className={`drop-zone ${isDropZoneActive ? 'active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '3rem'
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '1rem' }}>🎯</div>
          <h2 style={{ color: 'white', marginBottom: '1rem' }}>
            欢迎来到你的工作台
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginBottom: '2rem' }}>
            你还没有安装任何模块。从模块商店拖拽模块到这里开始使用吧！
          </p>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '1.5rem',
            maxWidth: '400px'
          }}>
            <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>💡 使用提示：</h4>
            <ul style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              textAlign: 'left',
              fontSize: '14px',
              lineHeight: '1.6',
              paddingLeft: '1rem'
            }}>
              <li>去模块商店浏览可用模块</li>
              <li>拖拽感兴趣的模块到工作台</li>
              <li>或者点击"安装"按钮添加模块</li>
              <li>在这里管理和使用你的模块</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      {/* 侧边栏 - 已安装模块列表 */}
      <div style={{
        width: '280px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '16px' }}>
          🔧 已安装模块
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {installedModules.map(module => (
            <div
              key={module.id}
              onClick={() => setSelectedModule(module.id)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: selectedModule === module.id 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedModule === module.id 
                  ? '1px solid rgba(255, 255, 255, 0.3)' 
                  : '1px solid transparent',
                transition: 'all 0.2s ease',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                if (selectedModule !== module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedModule !== module.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                  {module.displayName}
                </div>
                <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  v{module.version}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUninstall(module.id)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px'
                }}
                title="卸载模块"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* 拖拽区域提示 */}
        <div 
          className={`drop-zone ${isDropZoneActive ? 'active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            textAlign: 'center',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
            💡 拖拽新模块到这里安装
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div style={{ 
        flex: 1, 
        padding: '1.5rem',
        overflow: 'auto',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        {selectedModule && renderModuleComponent(selectedModule)}
      </div>
    </div>
  )
}

export default Workspace