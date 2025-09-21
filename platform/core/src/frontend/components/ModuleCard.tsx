import React, { useState } from 'react'
import { ModuleInfo } from '../types'

interface ModuleCardProps {
  module: ModuleInfo
  isInstalled: boolean
  onInstall: (moduleId: string) => void
  onUninstall: (moduleId: string) => void
  isDragMode?: boolean
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isInstalled,
  onInstall,
  onUninstall,
  isDragMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleAction = async () => {
    setIsLoading(true)
    try {
      if (isInstalled) {
        await onUninstall(module.id)
      } else {
        await onInstall(module.id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'core-module': return '#4f46e5'
      case 'enhancement-module': return '#059669'
      case 'integration-module': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'core-module': return '核心模块'
      case 'enhancement-module': return '增强模块'
      case 'integration-module': return '集成模块'
      default: return '未知'
    }
  }

  const getGradientBackground = (type: string) => {
    switch (type) {
      case 'core-module': return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      case 'enhancement-module': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      case 'integration-module': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    }
  }

  return (
    <div
      className="module-card"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        border: isHovered ? '1px solid rgba(102, 126, 234, 0.3)' : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(102, 126, 234, 0.2)'
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        cursor: !isInstalled && isDragMode ? 'grab' : 'default',
        opacity: isLoading ? 0.7 : 1,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
      draggable={!isInstalled && isDragMode}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={(e) => {
        if (!isInstalled && isDragMode) {
          e.dataTransfer.setData('text/plain', module.id)
          e.dataTransfer.effectAllowed = 'copy'
        }
      }}
    >
      {/* 渐变背景装饰 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: getGradientBackground(module.type),
          borderRadius: '16px 16px 0 0'
        }}
      />

      {/* 模块头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: getGradientBackground(module.type),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {module.icon || '🔧'}
          </div>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
              letterSpacing: '-0.025em'
            }}>
              {module.displayName}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{
                background: 'rgba(107, 114, 128, 0.1)',
                color: '#6b7280',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                {getTypeLabel(module.type)}
              </span>
              <span style={{
                color: '#9ca3af',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                v{module.version}
              </span>
            </div>
          </div>
        </div>

        {isInstalled && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>✓</span>
            已安装
          </div>
        )}
      </div>

      {/* 模块描述 */}
      <p style={{ 
        color: '#666', 
        fontSize: '14px', 
        lineHeight: '1.5',
        marginBottom: '1rem'
      }}>
        {module.description}
      </p>

      {/* 评分和统计 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⭐ {module.rating || 4.5}</span>
          <span>📦 {module.downloadCount || 0}</span>
        </div>
        <span>v{module.version}</span>
      </div>

      {/* 功能特性（可展开） */}
      {isExpanded && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', color: '#333' }}>主要功能：</h4>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '16px',
            fontSize: '13px',
            lineHeight: '1.4',
            color: '#666'
          }}>
            {module.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleAction}
          disabled={isLoading}
          style={{
            flex: 1,
            background: isInstalled
              ? 'rgba(239, 68, 68, 0.1)'
              : getGradientBackground(module.type),
            color: isInstalled ? '#ef4444' : 'white',
            border: isInstalled ? '1px solid rgba(239, 68, 68, 0.2)' : 'none',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isInstalled
              ? 'none'
              : '0 4px 12px rgba(102, 126, 234, 0.3)',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = isInstalled
                ? '0 4px 12px rgba(239, 68, 68, 0.2)'
                : '0 6px 16px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = isInstalled
              ? 'none'
              : '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              处理中...
            </span>
          ) : isInstalled ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              🗑️ 卸载
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              ⬇️ 安装
            </span>
          )}
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'rgba(107, 114, 128, 0.1)',
            color: '#6b7280',
            border: '1px solid rgba(107, 114, 128, 0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            minWidth: '80px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.2)'
          }}
        >
          {isExpanded ? '收起' : '详情'}
        </button>
      </div>

      {/* 拖拽提示 */}
      {!isInstalled && isDragMode && (
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          padding: '8px 12px',
          background: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '8px',
          border: '1px dashed rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{
            fontSize: '12px',
            color: '#667eea',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span>🎯</span>
            拖拽到工作台快速安装
          </div>
        </div>
      )}
    </div>
  )
}

export default ModuleCard